const fs = require('fs');
const file = 'src/lib/translations.ts';
let text = fs.readFileSync(file, 'utf8');

const enNotif = `
        notifications: {
            title: 'Notifications',
            markAllRead: 'Mark all as read',
            empty: 'No notifications yet.',
            noNew: 'You\\'re all caught up!',
        },`;

const uzNotif = `
        notifications: {
            title: 'Bildirishnomalar',
            markAllRead: 'Barchasini o\\'qilgan deb belgilash',
            empty: 'Hozircha bildirishnomalar yo\\'q.',
            noNew: 'Hamma xabarlar o\\'qilgan!',
        },`;

const ruNotif = `
        notifications: {
            title: 'Уведомления',
            markAllRead: 'Отметить все как прочитанные',
            empty: 'Пока нет уведомлений.',
            noNew: 'У вас нет новых уведомлений!',
        },`;

// Replace first occurrence (en)
text = text.replace(/(\s+)(dashboard:\s*\{)/, enNotif + '$1$2');
// Replace second occurrence (uz)
text = text.replace(/(\s+)(dashboard:\s*\{)/, uzNotif + '$1$2');
// Replace third occurrence (ru)
text = text.replace(/(\s+)(dashboard:\s*\{)/, ruNotif + '$1$2');

fs.writeFileSync(file, text);
console.log('Translations patched!');
