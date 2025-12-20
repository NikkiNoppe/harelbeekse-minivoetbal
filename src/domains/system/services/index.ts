// System Domain - Services
// Re-exports all system and admin-related services from their original locations

export { adminService, type AdminUser } from '@/services/admin/adminService';
export { blogService, fetchBlogPosts, createBlogPost, updateBlogPost, deleteBlogPost, type BlogPostData, type BlogPost } from '@/services/blogService';
export { notificationService, type NotificationData, type Notification } from '@/services/notificationService';
export { seasonService, type SeasonData } from '@/services/seasonService';
export { timeslotPriorityService } from '@/services/timeslotPriorityService';
export { priorityOrderService } from '@/services/priorityOrderService';
