import axios from 'axios';
import {loadUsers, save} from './database'
import https from 'https';
import dotenv from 'dotenv';
dotenv.config()
const BASE_URL = process.env.API_URL;

const agent = new https.Agent({ rejectUnauthorized: false });
export interface User {
  id: number;
  telegramId: bigint;
  username:string;
  apiKey: string;
}

export interface KeyInfo {
  id: string;
port: string;
name: string;
password: string;
method: string;
accessUrl: string;
}
/**
 * Create a new access key for Outline server
 */
export async function createOutlineAccessKey(
  username: string,
userId: bigint,
method: string
): Promise<string> {
  try {
    const response = await axios.post<KeyInfo>(
      BASE_URL + '/access-keys',
      {method, name: username},
{
headers: {'Content-Type': 'application/json'}, httpsAgent: agent}
    );
    const data = response.data as KeyInfo;
    const users = loadUsers()
    const user = {
      id: users?.length ? users.length +1 : 1,
      username,
      telegramId: userId,
      apiKey: data.accessUrl,
    }
    if(save(user)) return data.accessUrl;
    return 'Error while creating key. This use already exists in database'
  } catch (error) {
    console.error('Error creating Outline access key:', error);
    throw error;
  }
}

export async function getAllKeys() {
  try {
  const data = await axios.get<{accessKeys: KeyInfo[]}>(BASE_URL + '/access-keys')
  return (data.data.accessKeys as unknown as KeyInfo[]).map((k: KeyInfo) => k.accessUrl)
  } catch(err) {
    return err
  }
}