import axios from 'axios';
import {loadUsers, save} from ''
consr BASE_URL = process.env.API_URL;

export interface User {
  id: number;
  username:string;
  apiKey: string;
}

export i terface ApiKey {
  apiKey: string
}
/**
 * Create a new access key for Outline server
 */
export async function createOutlineAccessKey(
  name: string,
  username: string
): Promise<string> {
  try {
    const response = await axios.post<ApiKey>(
      `${server.apiUrl}/access-keys`,
      {
        name,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        httpsAgent: { rejectUnauthorized: false },
      }
    );
    const users = loadUsers()
    const user = {
      id: users.length+1,
      username,
      apiKey: response.data.apiKey;
    if(save(user)) return response.data.apiKey;
    return 'Error while creating key. This use already exists in database'
  } catch (error) {
    console.error('Error creating Outline access key:', error);
    throw error;
  }
}