import axios from 'axios'
import {writeFileSync} from 'fs'
/**
 * Retrieve API information from environment variables
 */
interface ApiInfo {
  certSha256: string;
  apiUrl: string;
}
export async function loadApiUrl() {
 const url = 'locahost/opt/outline/access.txt';
 return await axios.get<ApiInfo>(url).then(e => saveUrlToEnv(e.data.apiUrl))
}


function saveUrlToEnv(url: string) {
  const content = `API_URL=${url}`;
  writeFileSync(content, '.env');
}
