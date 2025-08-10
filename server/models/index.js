const User = require('./User');
const Contact = require('./Contact');
const ContactEmail = require('./ContactEmail');
const ContactPhone = require('./ContactPhone');
const ContactField = require('./ContactField');
const ContactFieldValue = require('./ContactFieldValue');
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

// ContactField associations
ContactField.hasMany(ContactFieldValue, {
  foreignKey: 'FIELDID',
  as: 'values',
  onDelete: 'CASCADE'
});
ContactFieldValue.belongsTo(ContactField, {
  foreignKey: 'FIELDID',
  as: 'field'
});

// Contact and ContactFieldValue associations
Contact.hasMany(ContactFieldValue, {
  foreignKey: 'CONTACTID',
  as: 'customFields',
  onDelete: 'CASCADE'
});
ContactFieldValue.belongsTo(Contact, {
  foreignKey: 'CONTACTID',
  as: 'contact'
});

module.exports = {
  User,
  Contact,
  ContactEmail,
  ContactPhone,
  ContactField,
  ContactFieldValue,
  Opportunity,
  Task,
  TaskType
};