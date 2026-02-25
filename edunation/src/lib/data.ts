export interface Course {
    id: string;
    title: string;
    instructor: string;
    instructorAvatar: string;
    category: string;
    thumbnail: string;
    rating: number;
    reviews: number;
    students: number;
    duration: string;
    lessons: number;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    price: number; // price in UZS
    isFree: boolean;
    isNew: boolean;
    description: string;
    tags: string[];
    lessons_list: Lesson[];
}

export interface Lesson {
    id: string;
    title: string;
    duration: string;
    isFree: boolean;
    videoUrl: string;
    description: string;
}

export interface Plan {
    id: string;
    name: string;
    price: number;        // monthly price in UZS
    yearlyPrice: number;  // monthly price when billed yearly in UZS
    description: string;
    features: string[];
    notIncluded: string[];
    color: string;
    popular: boolean;
    ctaKey: 'free' | 'pro' | 'enterprise';
}

export const courses: Course[] = [
    {
        id: 'react-mastery',
        title: 'React 18 Mastery: From Zero to Hero',
        instructor: 'Alex Johnson',
        instructorAvatar: 'AJ',
        category: 'Web Development',
        thumbnail: '/thumbnails/react.jpg',
        rating: 4.9,
        reviews: 3240,
        students: 28400,
        duration: '42 hours',
        lessons: 180,
        level: 'Beginner',
        price: 1_130_000,
        isFree: false,
        isNew: false,
        description: 'Master React 18 with hooks, context, Redux, and real-world projects. Build 10+ full-stack apps.',
        tags: ['React', 'JavaScript', 'Frontend', 'Hooks'],
        lessons_list: [
            { id: 'r1', title: 'Introduction to React', duration: '12:30', isFree: true, videoUrl: 'https://www.youtube.com/embed/SqcY0GlETPk', description: 'Learn what React is and why it matters.' },
            { id: 'r2', title: 'Setting Up Your Environment', duration: '18:45', isFree: true, videoUrl: 'https://www.youtube.com/embed/SqcY0GlETPk', description: 'Install Node.js, create-react-app, and VS Code setup.' },
            { id: 'r3', title: 'JSX Deep Dive', duration: '22:10', isFree: false, videoUrl: 'https://www.youtube.com/embed/SqcY0GlETPk', description: 'Understanding JSX syntax and its compilation.' },
            { id: 'r4', title: 'Components & Props', duration: '35:00', isFree: false, videoUrl: 'https://www.youtube.com/embed/SqcY0GlETPk', description: 'Building reusable components with dynamic props.' },
            { id: 'r5', title: 'State & useState Hook', duration: '40:15', isFree: false, videoUrl: 'https://www.youtube.com/embed/SqcY0GlETPk', description: 'Managing component state reactively.' },
            { id: 'r6', title: 'useEffect & Lifecycle', duration: '38:22', isFree: false, videoUrl: 'https://www.youtube.com/embed/SqcY0GlETPk', description: 'Side effects, cleanup, and the component lifecycle.' },
        ],
    },
    {
        id: 'ui-design',
        title: 'UI/UX Design Masterclass 2024',
        instructor: 'Sarah Chen',
        instructorAvatar: 'SC',
        category: 'Design',
        thumbnail: '/thumbnails/design.jpg',
        rating: 4.8,
        reviews: 2180,
        students: 19200,
        duration: '36 hours',
        lessons: 142,
        level: 'Beginner',
        price: 0,
        isFree: true,
        isNew: true,
        description: 'Learn Figma, design systems, user research, prototyping and build a stunning portfolio.',
        tags: ['Figma', 'UX', 'Prototyping', 'Design Systems'],
        lessons_list: [
            { id: 'd1', title: 'Design Thinking Fundamentals', duration: '20:00', isFree: true, videoUrl: 'https://www.youtube.com/embed/SqcY0GlETPk', description: 'The core principles of human-centered design.' },
            { id: 'd2', title: 'Getting Started with Figma', duration: '25:30', isFree: true, videoUrl: 'https://www.youtube.com/embed/SqcY0GlETPk', description: 'Full Figma interface walkthrough.' },
            { id: 'd3', title: 'Typography & Color Theory', duration: '30:15', isFree: true, videoUrl: 'https://www.youtube.com/embed/SqcY0GlETPk', description: 'Building beautiful and accessible color systems.' },
            { id: 'd4', title: 'Creating Design Systems', duration: '45:00', isFree: false, videoUrl: 'https://www.youtube.com/embed/SqcY0GlETPk', description: 'Scalable component libraries in Figma.' },
        ],
    },
    {
        id: 'python-ai',
        title: 'Python & AI: Machine Learning Bootcamp',
        instructor: 'Dr. Marcus Webb',
        instructorAvatar: 'MW',
        category: 'Data Science',
        thumbnail: '/thumbnails/python.jpg',
        rating: 4.9,
        reviews: 4100,
        students: 41000,
        duration: '58 hours',
        lessons: 220,
        level: 'Intermediate',
        price: 1_510_000,
        isFree: false,
        isNew: false,
        description: 'Deep dive into Python, NumPy, Pandas, Scikit-learn, TensorFlow, and build real AI models.',
        tags: ['Python', 'Machine Learning', 'TensorFlow', 'AI'],
        lessons_list: [
            { id: 'p1', title: 'Python Crash Course', duration: '55:00', isFree: true, videoUrl: 'https://www.youtube.com/embed/SqcY0GlETPk', description: 'Python fundamentals for data science.' },
            { id: 'p2', title: 'NumPy & Pandas Deep Dive', duration: '60:00', isFree: false, videoUrl: 'https://www.youtube.com/embed/SqcY0GlETPk', description: 'Data manipulation with powerful Python libraries.' },
            { id: 'p3', title: 'Data Visualization', duration: '42:00', isFree: false, videoUrl: 'https://www.youtube.com/embed/SqcY0GlETPk', description: 'Matplotlib and Seaborn for stunning charts.' },
            { id: 'p4', title: 'Your First ML Model', duration: '70:00', isFree: false, videoUrl: 'https://www.youtube.com/embed/SqcY0GlETPk', description: 'Build and train a regression model from scratch.' },
        ],
    },
    {
        id: 'nodejs-backend',
        title: 'Node.js & Express: Backend Engineering',
        instructor: 'James Rivera',
        instructorAvatar: 'JR',
        category: 'Web Development',
        thumbnail: '/thumbnails/node.jpg',
        rating: 4.7,
        reviews: 1820,
        students: 15600,
        duration: '38 hours',
        lessons: 160,
        level: 'Intermediate',
        price: 999_000,
        isFree: false,
        isNew: true,
        description: 'Build scalable REST APIs, authenticate users, work with databases, and deploy to production.',
        tags: ['Node.js', 'Express', 'MongoDB', 'REST API'],
        lessons_list: [
            { id: 'n1', title: 'Node.js Fundamentals', duration: '30:00', isFree: true, videoUrl: 'https://www.youtube.com/embed/SqcY0GlETPk', description: 'Understanding the Node.js event loop.' },
            { id: 'n2', title: 'Building REST APIs with Express', duration: '45:00', isFree: false, videoUrl: 'https://www.youtube.com/embed/SqcY0GlETPk', description: 'CRUD operations, middleware, and routing.' },
            { id: 'n3', title: 'MongoDB & Mongoose', duration: '50:00', isFree: false, videoUrl: 'https://www.youtube.com/embed/SqcY0GlETPk', description: 'Schema design and database operations.' },
            { id: 'n4', title: 'Authentication & JWT', duration: '55:00', isFree: false, videoUrl: 'https://www.youtube.com/embed/SqcY0GlETPk', description: 'Secure your APIs with JWT and OAuth.' },
        ],
    },
    {
        id: 'digital-marketing',
        title: 'Digital Marketing & SEO Mastery',
        instructor: 'Emma Thompson',
        instructorAvatar: 'ET',
        category: 'Marketing',
        thumbnail: '/thumbnails/marketing.jpg',
        rating: 4.6,
        reviews: 980,
        students: 8900,
        duration: '24 hours',
        lessons: 90,
        level: 'Beginner',
        price: 0,
        isFree: true,
        isNew: false,
        description: 'SEO, Google Ads, social media marketing, email campaigns, and analytics for business growth.',
        tags: ['SEO', 'Google Ads', 'Social Media', 'Analytics'],
        lessons_list: [
            { id: 'm1', title: 'Digital Marketing Overview', duration: '15:00', isFree: true, videoUrl: 'https://www.youtube.com/embed/SqcY0GlETPk', description: 'The digital marketing landscape in 2024.' },
            { id: 'm2', title: 'SEO Fundamentals', duration: '35:00', isFree: true, videoUrl: 'https://www.youtube.com/embed/SqcY0GlETPk', description: 'On-page, off-page, and technical SEO.' },
            { id: 'm3', title: 'Google Ads Mastery', duration: '40:00', isFree: false, videoUrl: 'https://www.youtube.com/embed/SqcY0GlETPk', description: 'PPC campaigns, bidding strategies, and ROI.' },
        ],
    },
    {
        id: 'nextjs-fullstack',
        title: 'Next.js 14: Full-Stack Development',
        instructor: 'Priya Sharma',
        instructorAvatar: 'PS',
        category: 'Web Development',
        thumbnail: '/thumbnails/nextjs.jpg',
        rating: 4.9,
        reviews: 2640,
        students: 22000,
        duration: '46 hours',
        lessons: 195,
        level: 'Advanced',
        price: 1_259_000,
        isFree: false,
        isNew: true,
        description: 'Build production-ready full-stack apps with Next.js 14 App Router, Server Components, and Prisma.',
        tags: ['Next.js', 'TypeScript', 'Prisma', 'Full-Stack'],
        lessons_list: [
            { id: 'nj1', title: 'Next.js 14 Overview', duration: '20:00', isFree: true, videoUrl: 'https://www.youtube.com/embed/SqcY0GlETPk', description: 'What\'s new in Next.js 14 App Router.' },
            { id: 'nj2', title: 'Server & Client Components', duration: '35:00', isFree: false, videoUrl: 'https://www.youtube.com/embed/SqcY0GlETPk', description: 'Understanding the rendering paradigm shift.' },
            { id: 'nj3', title: 'Data Fetching Strategies', duration: '42:00', isFree: false, videoUrl: 'https://www.youtube.com/embed/SqcY0GlETPk', description: 'SSR, SSG, ISR, and streaming.' },
            { id: 'nj4', title: 'Prisma & Database Integration', duration: '50:00', isFree: false, videoUrl: 'https://www.youtube.com/embed/SqcY0GlETPk', description: 'Type-safe database queries with Prisma ORM.' },
        ],
    },
];

export const plans: Plan[] = [
    {
        id: 'free',
        name: 'Free',
        price: 0,
        yearlyPrice: 0,
        description: 'Perfect for beginners exploring the platform',
        features: [
            'Access to 50+ free lessons',
            'Basic course previews',
            'Community forum access',
            'Mobile app access',
            'Course completion certificates (free courses)',
        ],
        notIncluded: [
            'Premium video courses',
            'Downloadable resources',
            'Live Q&A sessions',
            'Priority support',
        ],
        color: '#10b981',
        popular: false,
        ctaKey: 'free',
    },
    {
        id: 'pro',
        name: 'Pro',
        price: 370_000,
        yearlyPrice: 249_000,
        description: 'For serious learners who want unlimited access',
        features: [
            'Unlimited access to ALL courses',
            'Downloadable video lessons',
            'HD video quality (1080p)',
            'Course completion certificates',
            'Live Q&A sessions (weekly)',
            'Priority email support',
            'Offline mobile access',
            'New courses every month',
        ],
        notIncluded: [
            '1-on-1 mentorship',
            'Team collaboration tools',
        ],
        color: '#7c3aed',
        popular: true,
        ctaKey: 'pro',
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: 990_000,
        yearlyPrice: 749_000,
        description: 'For teams and organizations at scale',
        features: [
            'Everything in Pro',
            'Up to 50 team seats',
            '1-on-1 mentorship sessions',
            'Custom learning paths',
            'Team progress analytics',
            'Dedicated account manager',
            'API access & integrations',
            'Custom branding options',
            'SCORM/LMS integration',
        ],
        notIncluded: [],
        color: '#06b6d4',
        popular: false,
        ctaKey: 'enterprise',
    },
];

export const categories = [
    { name: 'All', icon: '🎯', count: courses.length },
    { name: 'Web Development', icon: '💻', count: courses.filter(c => c.category === 'Web Development').length },
    { name: 'Design', icon: '🎨', count: courses.filter(c => c.category === 'Design').length },
    { name: 'Data Science', icon: '📊', count: courses.filter(c => c.category === 'Data Science').length },
    { name: 'Marketing', icon: '📢', count: courses.filter(c => c.category === 'Marketing').length },
];

export const testimonials = [
    {
        id: 1,
        name: 'Ryan Mitchell',
        role: 'Frontend Developer at Google',
        avatar: 'RM',
        rating: 5,
        text: 'EduNationUz completely transformed my career. The React course was incredibly in-depth, and within 3 months I landed my dream job at Google. Worth every penny!',
        course: 'React 18 Mastery',
    },
    {
        id: 2,
        name: 'Fatima Al-Hassan',
        role: 'UX Designer at Apple',
        avatar: 'FA',
        rating: 5,
        text: 'The UI/UX design course is phenomenal. Sarah\'s teaching style is so clear and engaging. I went from zero design knowledge to building a full portfolio.',
        course: 'UI/UX Design Masterclass',
    },
    {
        id: 3,
        name: 'Carlos Mendez',
        role: 'Data Scientist at Netflix',
        avatar: 'CM',
        rating: 5,
        text: 'The Python AI bootcamp is hands-down the best ML course available. Dr. Webb explains complex concepts with such clarity. My salary doubled after completing it.',
        course: 'Python & AI Bootcamp',
    },
    {
        id: 4,
        name: 'Yuki Tanaka',
        role: 'Full-Stack Engineer at Stripe',
        avatar: 'YT',
        rating: 5,
        text: 'Subscribed to the Pro plan and it\'s insane value. Access to all courses for less than a Netflix subscription. Built 3 full projects and got hired!',
        course: 'Next.js Full-Stack',
    },
];

export const stats = [
    { value: '150K+', label: 'Active Students' },
    { value: '500+', label: 'Video Courses' },
    { value: '120+', label: 'Expert Instructors' },
    { value: '98%', label: 'Satisfaction Rate' },
];
