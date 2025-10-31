// MongoDB initialization script
db = db.getSiblingDB('automobile_sms');

// Create collections
db.createCollection('users');
db.createCollection('appointments');
db.createCollection('servicelogs');

// Create indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "employeeId": 1 }, { unique: true, sparse: true });
db.users.createIndex({ "role": 1 });

db.appointments.createIndex({ "customer": 1 });
db.appointments.createIndex({ "assignedEmployee": 1 });
db.appointments.createIndex({ "status": 1 });
db.appointments.createIndex({ "scheduledDate": 1 });
db.appointments.createIndex({ "vehicle.licensePlate": 1 });

db.servicelogs.createIndex({ "appointment": 1 });
db.servicelogs.createIndex({ "employee": 1 });
db.servicelogs.createIndex({ "startTime": 1 });
db.servicelogs.createIndex({ "status": 1 });

print('Database initialized successfully!');
