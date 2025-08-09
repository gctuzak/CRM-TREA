const User = require('./User');
const Contact = require('./Contact');
const ContactEmail = require('./ContactEmail');
const ContactPhone = require('./ContactPhone');
const Opportunity = require('./Opportunity');
const Task = require('./Task');
const TaskType = require('./TaskType');

// Define associations based on actual database schema

// Contact associations
Contact.hasMany(ContactEmail, { 
  foreignKey: 'CONTACTID', 
  as: 'emails',
  onDelete: 'CASCADE'
});
ContactEmail.belongsTo(Contact, { 
  foreignKey: 'CONTACTID', 
  as: 'contact'
});

Contact.hasMany(ContactPhone, { 
  foreignKey: 'CONTACTID', 
  as: 'phones',
  onDelete: 'CASCADE'
});
ContactPhone.belongsTo(Contact, { 
  foreignKey: 'CONTACTID', 
  as: 'contact'
});

Contact.hasMany(Opportunity, { 
  foreignKey: 'CONTACTID', 
  as: 'opportunities',
  onDelete: 'SET NULL'
});
Opportunity.belongsTo(Contact, { 
  foreignKey: 'CONTACTID', 
  as: 'contact'
});

Contact.hasMany(Task, { 
  foreignKey: 'CONTACTID', 
  as: 'tasks',
  onDelete: 'SET NULL'
});
Task.belongsTo(Contact, { 
  foreignKey: 'CONTACTID', 
  as: 'contact'
});

// User associations
User.hasMany(Contact, { 
  foreignKey: 'USERID', 
  as: 'createdContacts',
  onDelete: 'SET NULL'
});
Contact.belongsTo(User, { 
  foreignKey: 'USERID', 
  as: 'creator'
});

User.hasMany(Contact, { 
  foreignKey: 'USERIDEDIT', 
  as: 'editedContacts',
  onDelete: 'SET NULL'
});
Contact.belongsTo(User, { 
  foreignKey: 'USERIDEDIT', 
  as: 'editor'
});

User.hasMany(Opportunity, { 
  foreignKey: 'OWNERUSERID', 
  as: 'ownedOpportunities',
  onDelete: 'SET NULL'
});
Opportunity.belongsTo(User, { 
  foreignKey: 'OWNERUSERID', 
  as: 'owner'
});

User.hasMany(Opportunity, { 
  foreignKey: 'USERID', 
  as: 'assignedOpportunities',
  onDelete: 'SET NULL'
});
Opportunity.belongsTo(User, { 
  foreignKey: 'USERID', 
  as: 'assignedUser'
});

User.hasMany(Opportunity, { 
  foreignKey: 'USERIDEDIT', 
  as: 'editedOpportunities',
  onDelete: 'SET NULL'
});
Opportunity.belongsTo(User, { 
  foreignKey: 'USERIDEDIT', 
  as: 'editor'
});

User.hasMany(Task, { 
  foreignKey: 'USERID', 
  as: 'assignedTasks',
  onDelete: 'SET NULL'
});
Task.belongsTo(User, { 
  foreignKey: 'USERID', 
  as: 'assignedUser'
});

User.hasMany(Task, { 
  foreignKey: 'USERIDEDIT', 
  as: 'editedTasks',
  onDelete: 'SET NULL'
});
Task.belongsTo(User, { 
  foreignKey: 'USERIDEDIT', 
  as: 'editor'
});

// Opportunity and Task associations
Opportunity.hasMany(Task, { 
  foreignKey: 'OPPORTUNITYID', 
  as: 'tasks',
  onDelete: 'SET NULL'
});
Task.belongsTo(Opportunity, { 
  foreignKey: 'OPPORTUNITYID', 
  as: 'opportunity'
});

// Self-referencing Task association for parent-child relationships
Task.hasMany(Task, {
  foreignKey: 'PARENTTASKID',
  as: 'subtasks',
  onDelete: 'SET NULL'
});
Task.belongsTo(Task, {
  foreignKey: 'PARENTTASKID',
  as: 'parentTask'
});

// TaskType associations
TaskType.hasMany(Task, {
  foreignKey: 'TYPEID',
  as: 'tasks',
  onDelete: 'SET NULL'
});
Task.belongsTo(TaskType, {
  foreignKey: 'TYPEID',
  as: 'taskType'
});

module.exports = {
  User,
  Contact,
  ContactEmail,
  ContactPhone,
  Opportunity,
  Task,
  TaskType
};