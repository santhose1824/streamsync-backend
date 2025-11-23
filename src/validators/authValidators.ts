import {z} from 'zod';

export const registerSchema = z.object({
    name: z.string().min(1,'Name is required'),
    email: z.string().email('Invalid email'),
    password:z.string().min(8,'Password must be atleast 8 charcters'),
});

export const loginSchema =  z.object({
    email:z.string().email('Invalid email'),
    password:z.string().min(1,'Password is required'),
});

export const refreshSchema = z.object({
    refreshToken:z.string().min(1,'refreshToken is  requried')
});

export const updateProfileSchema = z.object({
    name:z.string().min(1).optional(),
    email:z.string().email().optional(),
});


export const changePasswordSchema = z.object({
    currentPassword:z.string().min(1),
    newPassword:z.string().min(8),
});

