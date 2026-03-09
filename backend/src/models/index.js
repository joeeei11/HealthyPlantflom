const User = require('./User');
const StudentProfile = require('./StudentProfile');
const CounselorProfile = require('./CounselorProfile');
const Appointment = require('./Appointment');
const Session = require('./Session');
const SessionNote = require('./SessionNote');
const Feedback = require('./Feedback');
const Announcement = require('./Announcement');
const AiConversation = require('./AiConversation');
const AiMessage = require('./AiMessage');

// ── User ↔ StudentProfile ────────────────────────────────────────────────────
User.hasOne(StudentProfile, { foreignKey: 'userId', as: 'studentProfile' });
StudentProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ── User ↔ CounselorProfile ──────────────────────────────────────────────────
User.hasOne(CounselorProfile, { foreignKey: 'userId', as: 'counselorProfile' });
CounselorProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ── Appointment ↔ User ───────────────────────────────────────────────────────
Appointment.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
Appointment.belongsTo(User, { foreignKey: 'counselorId', as: 'counselor' });

// ── Session ↔ Appointment / User ─────────────────────────────────────────────
Appointment.hasOne(Session, { foreignKey: 'appointmentId', as: 'session' });
Session.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });
Session.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
Session.belongsTo(User, { foreignKey: 'counselorId', as: 'counselor' });

// ── SessionNote ↔ Session / User ─────────────────────────────────────────────
Session.hasMany(SessionNote, { foreignKey: 'sessionId', as: 'notes' });
SessionNote.belongsTo(Session, { foreignKey: 'sessionId', as: 'session' });
SessionNote.belongsTo(User, { foreignKey: 'counselorId', as: 'counselor' });

// ── Feedback ↔ Session / User ─────────────────────────────────────────────────
Session.hasOne(Feedback, { foreignKey: 'sessionId', as: 'feedback' });
Feedback.belongsTo(Session, { foreignKey: 'sessionId', as: 'session' });
Feedback.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
Feedback.belongsTo(User, { foreignKey: 'counselorId', as: 'counselor' });

// ── Announcement ↔ User ───────────────────────────────────────────────────────
Announcement.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

// ── AiConversation ↔ User / AiMessage ────────────────────────────────────────
AiConversation.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
AiConversation.hasMany(AiMessage, { foreignKey: 'conversationId', as: 'messages' });
AiMessage.belongsTo(AiConversation, { foreignKey: 'conversationId', as: 'conversation' });

module.exports = { User, StudentProfile, CounselorProfile, Appointment, Session, SessionNote, Feedback, Announcement, AiConversation, AiMessage };
