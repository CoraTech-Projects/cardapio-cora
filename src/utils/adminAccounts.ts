import fs from 'fs';
import path from 'path';

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

function checkFor(email: string | any): Account | undefined {
  const result: any = accounts.find((x: Account) => {
    const entry = Object.entries(x);
    return entry[0][1].email === email;
  });
  return result[email];
}

function loginAdminToken(email: string, token: string) {
  const account: Account | undefined = checkFor(email);
  if (!account) return false;
  account.token = token;
  fs.writeFileSync(
    path.resolve(process.cwd(), 'src', 'utils', 'accounts.json'),
    JSON.stringify(accounts, null, 2)
  );
  return true;
}

function getAdminByToken(token: string): Account | undefined {
  return accounts.find((x: Account) => x.token == token);
}

export { checkFor, loginAdminToken, getAdminByToken };
