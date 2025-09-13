import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-55f0477a/health", (c) => {
  return c.json({ status: "ok" });
});

// User registration endpoint
app.post("/make-server-55f0477a/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name, role = "user" } = body;

    if (!email || !password || !name) {
      return c.json({ error: "Email, password, and name are required" }, 400);
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log("Error creating user:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ user: data.user });
  } catch (error) {
    console.log("Error in signup route:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get current user profile
app.get("/make-server-55f0477a/profile", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: "No access token provided" }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    return c.json({ user });
  } catch (error) {
    console.log("Error getting user profile:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Create a new task (admin only)
app.post("/make-server-55f0477a/tasks", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: "No access token provided" }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user || user.user_metadata?.role !== 'admin') {
      return c.json({ error: "Unauthorized - Admin access required" }, 401);
    }

    const body = await c.req.json();
    const { title, description, startDate, endDate, location, assignedUsers, workArea, priority } = body;

    if (!title || !description || !startDate || !endDate) {
      return c.json({ error: "Title, description, start date, and end date are required" }, 400);
    }

    const taskId = crypto.randomUUID();
    const task = {
      id: taskId,
      title,
      description,
      startDate,
      endDate,
      location,
      assignedUsers: assignedUsers || [],
      workArea: workArea || 'general',
      priority: priority || 'medium',
      status: 'pending',
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      completed: false
    };

    await kv.set(`task:${taskId}`, task);

    // Add task to assigned users' task lists
    if (assignedUsers && assignedUsers.length > 0) {
      for (const userId of assignedUsers) {
        const userTasks = await kv.get(`user_tasks:${userId}`) || [];
        userTasks.push(taskId);
        await kv.set(`user_tasks:${userId}`, userTasks);
      }
    }

    return c.json({ task });
  } catch (error) {
    console.log("Error creating task:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get all tasks (admin) or assigned tasks (user)
app.get("/make-server-55f0477a/tasks", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: "No access token provided" }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    if (user.user_metadata?.role === 'admin') {
      // Admin can see all tasks
      const allTasks = await kv.getByPrefix('task:');
      return c.json({ tasks: allTasks });
    } else {
      // Regular user sees only assigned tasks
      const userTaskIds = await kv.get(`user_tasks:${user.id}`) || [];
      const tasks = [];
      for (const taskId of userTaskIds) {
        const task = await kv.get(`task:${taskId}`);
        if (task) tasks.push(task);
      }
      return c.json({ tasks });
    }
  } catch (error) {
    console.log("Error getting tasks:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Update task status (mark as completed)
app.put("/make-server-55f0477a/tasks/:id/complete", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: "No access token provided" }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const taskId = c.req.param('id');
    const task = await kv.get(`task:${taskId}`);
    
    if (!task) {
      return c.json({ error: "Task not found" }, 404);
    }

    // Check if user is assigned to this task or is admin
    if (user.user_metadata?.role !== 'admin' && !task.assignedUsers.includes(user.id)) {
      return c.json({ error: "Unauthorized - Not assigned to this task" }, 401);
    }

    task.completed = true;
    task.completedAt = new Date().toISOString();
    task.completedBy = user.id;
    task.status = 'completed';

    await kv.set(`task:${taskId}`, task);

    return c.json({ task });
  } catch (error) {
    console.log("Error completing task:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get all users (admin only)
app.get("/make-server-55f0477a/users", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: "No access token provided" }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user || user.user_metadata?.role !== 'admin') {
      return c.json({ error: "Unauthorized - Admin access required" }, 401);
    }

    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) {
      return c.json({ error: usersError.message }, 400);
    }

    return c.json({ users: users.users });
  } catch (error) {
    console.log("Error getting users:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Delete task (admin only)
app.delete("/make-server-55f0477a/tasks/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: "No access token provided" }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user || user.user_metadata?.role !== 'admin') {
      return c.json({ error: "Unauthorized - Admin access required" }, 401);
    }

    const taskId = c.req.param('id');
    const task = await kv.get(`task:${taskId}`);
    
    if (!task) {
      return c.json({ error: "Task not found" }, 404);
    }

    // Remove task from assigned users' lists
    if (task.assignedUsers && task.assignedUsers.length > 0) {
      for (const userId of task.assignedUsers) {
        const userTasks = await kv.get(`user_tasks:${userId}`) || [];
        const updatedTasks = userTasks.filter(id => id !== taskId);
        await kv.set(`user_tasks:${userId}`, updatedTasks);
      }
    }

    await kv.del(`task:${taskId}`);

    return c.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.log("Error deleting task:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

Deno.serve(app.fetch);