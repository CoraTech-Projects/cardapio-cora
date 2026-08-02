import fs from 'fs';
import path from 'path';
import { db } from '../structures/db.js';

interface Account {
  email: string;
  name: string;
  identifier: string;
  password: string;
  role: string;
  token: string;
}

const accounts: Account[] = Array(
  JSON.parse(
    fs.readFileSync(
      path.resolve(process.cwd(), 'src', 'utils', 'accounts.json'),
      'utf-8'
    )
  )
) as Account[];

function checkFor(email: string | any) {}

function loginAdminToken(email: string, token: string) {}

function getAdminByToken(token: string) {}

export { checkFor, loginAdminToken, getAdminByToken };
