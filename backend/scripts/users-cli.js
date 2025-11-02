#!/usr/bin/env node
import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import User from '../models/User.js';

dotenv.config();

const usage = () => {
  console.log(`\nUsers CLI\n\nCommands:\n  node scripts/users-cli.js create-employee --email <email> --password <pw> --first <First> --last <Last> --phone <phone> --employeeId <EMP001> --department <mechanical|electrical|bodywork|painting|inspection|management>\n  node scripts/users-cli.js create-admin --email <email> --password <pw> --first <First> --last <Last> --phone <phone> --department management\n  node scripts/users-cli.js promote --email <email> --role <employee|admin> [--employeeId <EMP001>] [--department <dept>]\n`);
};

const parseArgs = (argv) => {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      args[key] = val;
    }
  }
  return args;
};

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);

  if (!cmd) {
    usage();
    process.exit(1);
  }

  await connectDB();

  try {
    if (cmd === 'create-employee') {
      const required = ['email','password','first','last','phone','employeeId','department'];
      for (const k of required) {
        if (!args[k]) throw new Error(`Missing --${k}`);
      }
      const user = new User({
        firstName: args.first,
        lastName: args.last,
        email: args.email.toLowerCase(),
        password: args.password,
        phone: args.phone,
        role: 'employee',
        employeeId: args.employeeId,
        department: args.department,
        isActive: true,
      });
      await user.save();
      console.log('Employee created:', user.email, user.employeeId, user.department);
    } else if (cmd === 'create-admin') {
      const required = ['email','password','first','last','phone','department'];
      for (const k of required) {
        if (!args[k]) throw new Error(`Missing --${k}`);
      }
      const user = new User({
        firstName: args.first,
        lastName: args.last,
        email: args.email.toLowerCase(),
        password: args.password,
        phone: args.phone,
        role: 'admin',
        department: args.department || 'management',
        isActive: true,
      });
      await user.save();
      console.log('Admin created:', user.email, user.department);
    } else if (cmd === 'promote') {
      const { email, role, employeeId, department } = args;
      if (!email || !role) throw new Error('Missing --email or --role');
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) throw new Error('User not found');
      if (!['employee','admin'].includes(role)) throw new Error('Invalid role');
      user.role = role;
      if (role === 'employee') {
        if (!employeeId) throw new Error('Missing --employeeId');
        if (!department) throw new Error('Missing --department');
        user.employeeId = employeeId;
        user.department = department;
      } else if (role === 'admin') {
        user.department = department || 'management';
      }
      await user.save();
      console.log(`User promoted: ${user.email} -> ${user.role}`);
    } else {
      usage();
      process.exit(1);
    }
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
