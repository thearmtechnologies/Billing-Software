import express from 'express';
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from "cookie-parser";

import connectMongoDB from './db/connectMongoDB.js';
import userRoutes from './routes/user.routes.js'
import invoiceRoutes from './routes/invoice.routes.js'
import serviceRoutes from './routes/service.routes.js'
import notificationRoutes from './routes/notification.routes.js'
import adminRoutes from './routes/admin.routes.js'
import { seedAdminUser } from './utils/seedAdmin.js';
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000;

const corsOptions = {
    origin: ["http://localhost:5174", "http://localhost:5173", "https://billings.thearmtechnologies.com"],
    methods: 'GET,POST,PUT,DELETE,OPTIONS,HEAD,PATCH',
    credentials: true,
}

// Middleware
app.use(cors(corsOptions));
app.use(express.json()); //to parse req.body
app.use(express.urlencoded({extended: true})) //parse form data
app.use(cookieParser())


app.use('/api/v1/users', userRoutes)
app.use('/api/v1/invoices', invoiceRoutes)
app.use('/api/v1/services', serviceRoutes)
app.use('/api/v1/notifications', notificationRoutes)
app.use('/api/v1/admin', adminRoutes)

app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    await connectMongoDB();
    await seedAdminUser();
})
