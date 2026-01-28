import axios from 'axios';
import {loadUsers, save} from './database'

const BASE_URL = process.env.API_URL;

const BASE_HTTP = axios.create({
  baseUrl: BASE_URL + '/access-keys',
    headers: {
      'Content-Type': 'application/json',
    
    },
    httpsAgent: { rejectUnauthorized: false },
})

export interface User {
  id: number;
  username:string;
  apiKey: string;
}

export interface ApiKey {
  apiKey: string;
}
/**
 * Create a new access key for Outline server
 */
export async function createOutlineAccessKey(
  name: string,
  username: string
): Promise<string> {
  try {
    const response = await BASE_HTTP.post<ApiKey>(
      {
        name,
      },
    );
    const users = loadUsers()
    const user = {
      id: users?.length ? users.length +1 : 1,
      username,
      apiKey: response.data.apiKey,
    }
    if(save(user)) return response.data.apiKey;
    return 'Error while creating key. This use already exists in database'
  } catch (error) {
    console.error('Error creating Outline access key:', error);
    throw error;
  }
}

export async function getAllKeys() {
  try {
  const data = await BASE_HTTP.get<ApiKey[]>()
  return data.data.map((k: ApiKey) => k.apiKey)
  } catch(err) {
    return err
  }
}