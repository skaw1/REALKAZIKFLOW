



export enum Page {
    Dashboard = 'Dashboard',
    Projects = 'Projects',
    MasterCalendar = 'MasterCalendar',
    Clients = 'Clients',
    Users = 'Users',
    Moodboard = 'Moodboard',
    Pomodoro = 'Pomodoro',
    Settings = 'Settings',
    Collaboration = 'Collaboration',
}

export type UserCategory = 'Primary Admin' | 'Temporary Admin' | 'Team Member' | 'Brand' | 'Business' | 'Client';

export interface NotificationPreferences {
    loginAlerts: boolean;
    progressUpdates: 'none' | 'milestones';
    deadlineReminders: boolean;
    notificationEmail: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    password?: string;
    avatarUrl: string;
    category: UserCategory;
    productivityScore: number;
    notificationPreferences: NotificationPreferences;
}

export interface Task {
    id: string;
    text: string;
    completed: boolean;
}

export interface ProjectURL {
    id:string;
    label: string;
    url: string;
}

export interface ProjectSharing {
  linkId: string;
  permission: 'view' | 'edit';
  isEnabled: boolean;
}

export interface Project {
    id: string;
    name: string;
    team: User[];
    completion: number;
    description: string;
    ownerId: string;
    status: 'Draft' | 'Real';
    deadline: Date | null;
    logoUrl?: string;
    tasks: Task[];
    notes: string;
    urls: ProjectURL[];
    clientId?: string;
    sharing?: ProjectSharing;
    moodboardItems: MoodboardItem[];
    trashedMoodboardItems: MoodboardItem[];
}

export type ClientStatus = 'Pending' | 'Confirmed' | 'Completed Project' | 'Canceled' | 'Not Interested';

export interface Client {
    id: string;
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    ownerId: string;
    status: ClientStatus;
    urls: ProjectURL[];
    notes: string;
    createdAt: Date;
}

export interface Notification {
    id:string;
    message: string;
    timestamp: string;
    read: boolean;
}

export interface SentEmail {
    id: string;
    to: string;
    subject: string;
    body: string;
    timestamp: Date;
    read: boolean;
}

export interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end?: Date;
    type: 'task' | 'reminder' | 'deadline' | 'meeting';
    ownerId: string;
    description?: string;
}

export type ContentPlatform = 'Blog' | 'X' | 'Instagram' | 'TikTok' | 'Facebook' | 'LinkedIn';
export type ContentStatus = 'Idea' | 'Draft' | 'In Progress' | 'Review' | 'Scheduled' | 'Published';

export interface PlatformPublishInfo {
    id: string;
    platform: ContentPlatform;
    publishTime: string; // "HH:MM" format
}

export interface ContentCalendarEntry {
    id: string;
    title: string;
    publishDate: Date;
    platformInfo: PlatformPublishInfo[];
    status: ContentStatus;
    script: string;
    notes: string;
    projectId: string | null;
    ownerId: string;
    executionTime?: string; // "HH:MM" format
}

export interface MoodboardItem {
    id: string;
    type: 'image' | 'note';
    content: string; // URL for image, text for note
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex: number;
    backgroundColor?: string;
    textColor?: string;
    backgroundImageUrl?: string;
}

export interface SocialLink {
    id: string;
    icon: 'X' | 'Facebook' | 'WhatsApp' | 'TikTok' | 'Instagram' | 'LinkedIn' | 'GitHub' | 'Email' | 'Phone';
    url: string;
}

export interface FooterSettings {
    copyright: string;
    socialLinks: SocialLink[];
}

export interface CollaborationSpace {
    id: string;
    name: string;
    description: string;
    ownerId: string; // User ID
    members: string[]; // User IDs
    pendingMembers: string[]; // User IDs
    meetings: CalendarEvent[];
    researchLinks: ProjectURL[];
    moodboardItems: MoodboardItem[];
    trashedMoodboardItems: MoodboardItem[];
    linkedProjectIds: string[];
}