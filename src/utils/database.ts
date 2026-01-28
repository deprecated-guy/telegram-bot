import {User} from './outline'
import {join} from 'path'
import {writeFileSync} from 'fs'
interface Db {
    users: User[]
}

export function loadUsers() {
    try {
        const data = JSON.parse(join(process.cwd(), 'db.json')) as unknown as Db;
    
        return data.users ?? [];
    } catch(e) {
        console.error(e)
    }
}

export function save(user: User) 
{
    const loaded = loadUsers() ?? [];


    const users = [...loaded, user]

    const updatedDb = JSON.stringify({
        users
    },null, 2);
    const found = find(user.username)
    if(!found) {
writeFileSync(join(process.cwd(),'database.json'), updatedDb)
return true;
    }
    return false
}

export function find(username: string) {
    return loadUsers()?.find(u => u.username.includes(username)) ?? null;
}