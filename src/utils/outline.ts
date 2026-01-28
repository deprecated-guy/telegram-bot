import axios from 'axios';
import {loadUsers, save} from './database'

const BASE_URL = process.env.API_URL;

const BASE_HTTP = axios.create({
  baseURL: BASE_URL + '/access-keys',
    headers: {
      'Content-Type': 'application/json',
}
})

export interface User {
  id: number;
  username:string;
  apiKey: string;
}

export interface KeyInfo {
  id: string;
port: string;
name: string;
password: string;
method: string;
accessKey: string;
}
/**
 * Create a new access key for Outline server
 */
export async function createOutlineAccessKey(
  name: string,
  username: string
): Promise<string> {
  try {
    const response = await axios.post<KeyInfo>(
      BASE_URL + '/access-keys',
      {method: "chacha20-ietf-poly1305"},
{headers: {'ContentType': 'application/json' }}
    );
    const data = response.data as KeyInfo;
    const users = loadUsers()
    const user = {
      id: users?.length ? users.length +1 : 1,
      username,
      apiKey: data.accessKey,
    }
    if(save(user)) return data.accessKey;
    return 'Error while creating key. This use already exists in database'
  } catch (error) {
    console.error('Error creating Outline access key:', error);
    throw error;
  }
}

export async function getAllKeys() {
  try {
  const data = await axios.get<KeyInfo[]>(BASE_URL + '/access-keys')
  return (data.data as unknown as KeyInfo[]).map((k: KeyInfo) => k.apiKey)
  } catch(err) {
    return err
  }
}