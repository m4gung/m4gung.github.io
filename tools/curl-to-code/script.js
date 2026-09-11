// === ELEMEN DOM ===
const curlInput = document.getElementById('curlInput');
const codeOutput = document.getElementById('codeOutput');
const langSelect = document.getElementById('langSelect');
const fullSnippetToggle = document.getElementById('fullSnippetToggle');
const sampleGetBtn = document.getElementById('sampleGetBtn');
const samplePostBtn = document.getElementById('samplePostBtn');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');
const themeToggle = document.getElementById('themeToggle');
const statusBadge = document.getElementById('statusBadge');
const parseStatus = document.getElementById('parseStatus');
const outputStatus = document.getElementById('outputStatus');

// === THEME MANAGER ===
(function () {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const nextTheme = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nextTheme);
        localStorage.setItem('theme', nextTheme);
        updateThemeIcon(nextTheme);
    });

    function updateThemeIcon(theme) {
        themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
})();

// === PRESET SAMPLES ===
const SAMPLE_GET = `curl -X GET "https://api.github.com/users/m4gung/repos?sort=updated&per_page=5" \\
  -H "Accept: application/vnd.github.v3+json" \\
  -H "User-Agent: Antigravity-App"`;

const SAMPLE_POST = `curl -X POST "https://api.example.com/v1/orders" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \\
  -d '{
    "customer_id": "CUST-9920",
    "items": [
      { "item_id": 101, "qty": 2, "price": 45000 },
      { "item_id": 105, "qty": 1, "price": 120000 }
    ],
    "payment_method": "QRIS",
    "note": "Kemas rapi & fragile"
  }'`;

sampleGetBtn.addEventListener('click', () => {
    curlInput.value = SAMPLE_GET;
    processConversion();
});

samplePostBtn.addEventListener('click', () => {
    curlInput.value = SAMPLE_POST;
    processConversion();
});

clearBtn.addEventListener('click', () => {
    curlInput.value = '';
    codeOutput.value = '';
    parseStatus.textContent = 'Menunggu input...';
    outputStatus.textContent = 'Otomatis diperbarui saat cURL diubah';
    statusBadge.textContent = 'Kosong';
    statusBadge.style.color = 'var(--text-muted)';
});

// === CURL PARSER ===
function parseCurl(rawInput) {
    if (!rawInput || !rawInput.trim()) return null;

    // Bersihkan kelanjutan baris \ atau ^
    let cleaned = rawInput.replace(/\\\r?\n/g, ' ').replace(/\^\r?\n/g, ' ').trim();

    // Tokenizer yang menghargai single quote dan double quote
    const tokens = [];
    let current = '';
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let escapeNext = false;

    for (let i = 0; i < cleaned.length; i++) {
        const char = cleaned[i];

        if (escapeNext) {
            current += char;
            escapeNext = false;
            continue;
        }

        if (char === '\\' && !inSingleQuote) {
            escapeNext = true;
            continue;
        }

        if (char === "'" && !inDoubleQuote) {
            inSingleQuote = !inSingleQuote;
            continue;
        }

        if (char === '"' && !inSingleQuote) {
            inDoubleQuote = !inDoubleQuote;
            continue;
        }

        if (/\s/.test(char) && !inSingleQuote && !inDoubleQuote) {
            if (current.length > 0) {
                tokens.push(current);
                current = '';
            }
        } else {
            current += char;
        }
    }
    if (current.length > 0) {
        tokens.push(current);
    }

    if (tokens.length === 0) return null;

    if (tokens[0].toLowerCase() === 'curl') {
        tokens.shift();
    }

    let method = '';
    let url = '';
    const headers = {};
    let data = '';
    const cookies = [];
    let userAgent = '';
    let userAuth = '';
    let insecure = false;

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (token === '-X' || token === '--request') {
            if (i + 1 < tokens.length) method = tokens[++i].toUpperCase();
        } else if (token === '-H' || token === '--header') {
            if (i + 1 < tokens.length) {
                const headerStr = tokens[++i];
                const colonIdx = headerStr.indexOf(':');
                if (colonIdx > -1) {
                    const key = headerStr.substring(0, colonIdx).trim();
                    const val = headerStr.substring(colonIdx + 1).trim();
                    headers[key] = val;
                }
            }
        } else if (token === '-d' || token === '--data' || token === '--data-raw' || token === '--data-binary' || token === '--data-urlencode') {
            if (i + 1 < tokens.length) {
                const chunk = tokens[++i];
                data = data ? (data + '&' + chunk) : chunk;
            }
        } else if (token === '--json') {
            if (i + 1 < tokens.length) {
                data = tokens[++i];
                if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';
                if (!headers['Accept']) headers['Accept'] = 'application/json';
            }
        } else if (token === '-u' || token === '--user') {
            if (i + 1 < tokens.length) userAuth = tokens[++i];
        } else if (token === '-A' || token === '--user-agent') {
            if (i + 1 < tokens.length) userAgent = tokens[++i];
        } else if (token === '-b' || token === '--cookie') {
            if (i + 1 < tokens.length) cookies.push(tokens[++i]);
        } else if (token === '-k' || token === '--insecure') {
            insecure = true;
        } else if (token === '-I' || token === '--head') {
            method = 'HEAD';
        } else if (!token.startsWith('-')) {
            if (!url) {
                url = token;
            }
        } else {
            // Cek opsi format --key=value
            if (token.startsWith('--header=')) {
                const headerStr = token.substring(9);
                const colonIdx = headerStr.indexOf(':');
                if (colonIdx > -1) {
                    headers[headerStr.substring(0, colonIdx).trim()] = headerStr.substring(colonIdx + 1).trim();
                }
            } else if (token.startsWith('--data=')) {
                data = token.substring(7);
            } else if (token.startsWith('--data-raw=')) {
                data = token.substring(11);
            } else if (token.startsWith('--user=')) {
                userAuth = token.substring(7);
            }
        }
    }

    if (userAgent) headers['User-Agent'] = userAgent;
    if (cookies.length > 0) headers['Cookie'] = cookies.join('; ');
    if (userAuth) {
        try {
            headers['Authorization'] = 'Basic ' + btoa(userAuth);
        } catch (e) {
            headers['Authorization'] = 'Basic ' + userAuth;
        }
    }

    if (!method) {
        method = data ? 'POST' : 'GET';
    }

    return { method, url, headers, data, insecure };
}

// === CODE GENERATORS ===

function escapeJavaString(str) {
    return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function escapeJsString(str) {
    return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\${/g, '\\${');
}

function escapePythonString(str) {
    if (str.includes('\n') || str.includes('"')) {
        return `"""${str.replace(/"""/g, '\\"\\"\\"')}"""`;
    }
    return `"${str.replace(/"/g, '\\"')}"`;
}

// 1. Java 11+ HttpClient
function genJavaHttpClient(parsed, isFull) {
    const { method, url, headers, data } = parsed;
    const headerLines = Object.entries(headers)
        .map(([k, v]) => `            .header("${escapeJavaString(k)}", "${escapeJavaString(v)}")`)
        .join('\n');

    let bodyPublisher = 'HttpRequest.BodyPublishers.noBody()';
    if (data && method !== 'GET' && method !== 'HEAD') {
        bodyPublisher = `HttpRequest.BodyPublishers.ofString("${escapeJavaString(data)}")`;
    }

    let methodCall = '';
    if (method === 'GET') {
        methodCall = '            .GET()';
    } else if (method === 'DELETE' && !data) {
        methodCall = '            .DELETE()';
    } else {
        methodCall = `            .method("${method}", ${bodyPublisher})`;
    }

    const snippet = `HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create("${escapeJavaString(url || 'https://api.example.com')}"))
${headerLines ? headerLines + '\n' : ''}${methodCall}
        .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

System.out.println("Status Code: " + response.statusCode());
System.out.println("Response Body: " + response.body());`;

    if (!isFull) return snippet;

    return `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class ApiClient {
    public static void main(String[] args) throws Exception {
${snippet.split('\n').map(l => '        ' + l).join('\n')}
    }
}`;
}

// 2. Spring RestTemplate
function genJavaRestTemplate(parsed, isFull) {
    const { method, url, headers, data } = parsed;
    const headerLines = Object.entries(headers)
        .map(([k, v]) => `        headers.set("${escapeJavaString(k)}", "${escapeJavaString(v)}");`)
        .join('\n');

    const bodyVar = data ? `"${escapeJavaString(data)}"` : 'null';

    const snippet = `RestTemplate restTemplate = new RestTemplate();

HttpHeaders headers = new HttpHeaders();
${headerLines ? headerLines + '\n' : ''}
HttpEntity<String> entity = new HttpEntity<>(${bodyVar}, headers);

ResponseEntity<String> response = restTemplate.exchange(
        "${escapeJavaString(url || 'https://api.example.com')}",
        HttpMethod.${method},
        entity,
        String.class
);

System.out.println("Status: " + response.getStatusCode());
System.out.println("Body: " + response.getBody());`;

    if (!isFull) return snippet;

    return `import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

public class SpringRestClient {
    public static void main(String[] args) {
${snippet.split('\n').map(l => '        ' + l).join('\n')}
    }
}`;
}

// 3. Spring WebClient
function genJavaWebClient(parsed, isFull) {
    const { method, url, headers, data } = parsed;
    const headerLines = Object.entries(headers)
        .map(([k, v]) => `                headers.set("${escapeJavaString(k)}", "${escapeJavaString(v)}");`)
        .join('\n');

    const bodyCall = (data && method !== 'GET') ? `\n            .bodyValue("${escapeJavaString(data)}")` : '';
    const headersBlock = headerLines ? `\n            .headers(headers -> {\n${headerLines}\n            })` : '';

    const snippet = `WebClient webClient = WebClient.create();

String response = webClient.method(HttpMethod.${method})
        .uri("${escapeJavaString(url || 'https://api.example.com')}")${headersBlock}${bodyCall}
        .retrieve()
        .bodyToMono(String.class)
        .block();

System.out.println(response);`;

    if (!isFull) return snippet;

    return `import org.springframework.http.HttpMethod;
import org.springframework.web.reactive.function.client.WebClient;

public class WebClientRunner {
    public static void main(String[] args) {
${snippet.split('\n').map(l => '        ' + l).join('\n')}
    }
}`;
}

// 4. Java OkHttp
function genJavaOkHttp(parsed, isFull) {
    const { method, url, headers, data } = parsed;
    const headerLines = Object.entries(headers)
        .map(([k, v]) => `        .addHeader("${escapeJavaString(k)}", "${escapeJavaString(v)}")`)
        .join('\n');

    let bodySetup = '';
    let bodyParam = 'null';
    if (data && method !== 'GET') {
        const contentType = headers['Content-Type'] || headers['content-type'] || 'application/json';
        bodySetup = `MediaType mediaType = MediaType.parse("${contentType}");\nRequestBody body = RequestBody.create(mediaType, "${escapeJavaString(data)}");\n\n`;
        bodyParam = 'body';
    } else if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
        bodySetup = `RequestBody body = RequestBody.create(null, new byte[0]);\n\n`;
        bodyParam = 'body';
    }

    const snippet = `OkHttpClient client = new OkHttpClient();

${bodySetup}Request request = new Request.Builder()
        .url("${escapeJavaString(url || 'https://api.example.com')}")
        .method("${method}", ${bodyParam})
${headerLines ? headerLines + '\n' : ''}        .build();

try (Response response = client.newCall(request).execute()) {
    System.out.println("Code: " + response.code());
    if (response.body() != null) {
        System.out.println(response.body().string());
    }
}`;

    if (!isFull) return snippet;

    return `import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import java.io.IOException;

public class OkHttpClientExample {
    public static void main(String[] args) throws IOException {
${snippet.split('\n').map(l => '        ' + l).join('\n')}
    }
}`;
}

// 5. JavaScript Fetch
function genJsFetch(parsed, isFull) {
    const { method, url, headers, data } = parsed;
    const fetchOptions = { method };

    if (Object.keys(headers).length > 0) {
        fetchOptions.headers = headers;
    }

    let isJson = false;
    let jsonFormatted = null;
    if (data) {
        try {
            jsonFormatted = JSON.parse(data);
            isJson = true;
        } catch (e) {
            isJson = false;
        }
    }

    let optionsStr = `  method: "${method}",\n`;
    if (Object.keys(headers).length > 0) {
        optionsStr += `  headers: ${JSON.stringify(headers, null, 4).replace(/\n/g, '\n  ')},\n`;
    }
    if (data) {
        if (isJson) {
            optionsStr += `  body: JSON.stringify(${JSON.stringify(jsonFormatted, null, 4).replace(/\n/g, '\n  ')})\n`;
        } else {
            optionsStr += `  body: "${escapeJsString(data)}"\n`;
        }
    } else {
        optionsStr = optionsStr.replace(/,\n$/, '\n');
    }

    const snippet = `const response = await fetch("${escapeJsString(url || 'https://api.example.com')}", {
${optionsStr}});

const data = await response.json();
console.log(data);`;

    if (!isFull) return snippet;

    return `async function callApi() {
  try {
${snippet.split('\n').map(l => '    ' + l).join('\n')}
  } catch (error) {
    console.error("API Error:", error);
  }
}

callApi();`;
}

// 6. JavaScript Axios
function genJsAxios(parsed, isFull) {
    const { method, url, headers, data } = parsed;

    let isJson = false;
    let parsedData = null;
    if (data) {
        try {
            parsedData = JSON.parse(data);
            isJson = true;
        } catch (e) {
            parsedData = data;
        }
    }

    let configStr = `  method: '${method.toLowerCase()}',\n  url: '${escapeJsString(url || 'https://api.example.com')}',\n`;
    if (Object.keys(headers).length > 0) {
        configStr += `  headers: ${JSON.stringify(headers, null, 4).replace(/\n/g, '\n  ')},\n`;
    }
    if (data) {
        if (isJson) {
            configStr += `  data: ${JSON.stringify(parsedData, null, 4).replace(/\n/g, '\n  ')}\n`;
        } else {
            configStr += `  data: '${escapeJsString(data)}'\n`;
        }
    } else {
        configStr = configStr.replace(/,\n$/, '\n');
    }

    const snippet = `const response = await axios({
${configStr}});

console.log(response.data);`;

    if (!isFull) return snippet;

    return `// npm install axios
const axios = require('axios');

async function makeRequest() {
  try {
${snippet.split('\n').map(l => '    ' + l).join('\n')}
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
  }
}

makeRequest();`;
}

// 7. Python Requests
function genPythonRequests(parsed, isFull) {
    const { method, url, headers, data } = parsed;

    let hasJson = false;
    let parsedJson = null;
    if (data) {
        try {
            parsedJson = JSON.parse(data);
            hasJson = true;
        } catch (e) {
            hasJson = false;
        }
    }

    let code = `import requests\n\n`;
    code += `url = "${url || 'https://api.example.com'}"\n\n`;

    if (Object.keys(headers).length > 0) {
        code += `headers = ${JSON.stringify(headers, null, 4).replace(/true/g, 'True').replace(/false/g, 'False')}\n\n`;
    } else {
        code += `headers = {}\n\n`;
    }

    if (data) {
        if (hasJson) {
            code += `payload = ${JSON.stringify(parsedJson, null, 4).replace(/true/g, 'True').replace(/false/g, 'False').replace(/null/g, 'None')}\n\n`;
            code += `response = requests.${method.toLowerCase()}(url, headers=headers, json=payload)\n`;
        } else {
            code += `payload = ${escapePythonString(data)}\n\n`;
            code += `response = requests.${method.toLowerCase()}(url, headers=headers, data=payload)\n`;
        }
    } else {
        code += `response = requests.${method.toLowerCase()}(url, headers=headers)\n`;
    }

    code += `\nprint("Status Code:", response.status_code)\nprint(response.text)`;

    if (!isFull) {
        return code.replace('import requests\n\n', '');
    }
    return code;
}

// 8. Python HTTPX
function genPythonHttpx(parsed, isFull) {
    const { method, url, headers, data } = parsed;

    let hasJson = false;
    let parsedJson = null;
    if (data) {
        try {
            parsedJson = JSON.parse(data);
            hasJson = true;
        } catch (e) {
            hasJson = false;
        }
    }

    let code = `import httpx\n\n`;
    code += `url = "${url || 'https://api.example.com'}"\n`;
    code += `headers = ${JSON.stringify(headers, null, 4).replace(/true/g, 'True').replace(/false/g, 'False')}\n\n`;

    if (data) {
        if (hasJson) {
            code += `json_data = ${JSON.stringify(parsedJson, null, 4).replace(/true/g, 'True').replace(/false/g, 'False').replace(/null/g, 'None')}\n\n`;
            code += `with httpx.Client() as client:\n    response = client.request("${method}", url, headers=headers, json=json_data)\n    print(response.text)`;
        } else {
            code += `content = ${escapePythonString(data)}\n\n`;
            code += `with httpx.Client() as client:\n    response = client.request("${method}", url, headers=headers, content=content)\n    print(response.text)`;
        }
    } else {
        code += `with httpx.Client() as client:\n    response = client.request("${method}", url, headers=headers)\n    print(response.text)`;
    }

    if (!isFull) {
        return code.replace('import httpx\n\n', '');
    }
    return code;
}

// 9. Go net/http
function genGoNetHttp(parsed, isFull) {
    const { method, url, headers, data } = parsed;

    let payloadDef = 'nil';
    let importStrings = '';
    if (data) {
        payloadDef = `strings.NewReader(\`${data.replace(/`/g, '` + "`" + `')}\`)`;
        importStrings = '\n\t"strings"';
    }

    const headerLines = Object.entries(headers)
        .map(([k, v]) => `\treq.Header.Add("${k}", "${v.replace(/"/g, '\\"')}")`)
        .join('\n');

    const snippet = `url := "${url || 'https://api.example.com'}"
\tpayload := ${payloadDef}

\treq, err := http.NewRequest("${method}", url, payload)
\tif err != nil {
\t\tpanic(err)
\t}

${headerLines ? headerLines + '\n' : ''}
\tres, err := http.DefaultClient.Do(req)
\tif err != nil {
\t\tpanic(err)
\t}
\tdefer res.Body.Close()

\tbody, _ := io.ReadAll(res.Body)
\tfmt.Println(res.Status)
\tfmt.Println(string(body))`;

    if (!isFull) return snippet;

    return `package main

import (
\t"fmt"
\t"io"
\t"net/http"${importStrings}
)

func main() {
${snippet}
}`;
}

// 10. PHP cURL
function genPhpCurl(parsed, isFull) {
    const { method, url, headers, data } = parsed;

    const headerArray = Object.entries(headers)
        .map(([k, v]) => `  '${k}: ${v.replace(/'/g, "\\'")}',`)
        .join('\n');

    let postFields = '';
    if (data && method !== 'GET') {
        postFields = `  CURLOPT_POSTFIELDS => '${data.replace(/'/g, "\\'")}',\n`;
    }

    const snippet = `$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => '${url || 'https://api.example.com'}',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => '',
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 30,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => '${method}',
${postFields}  CURLOPT_HTTPHEADER => array(
${headerArray}
  ),
));

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
  echo "cURL Error #:" . $err;
} else {
  echo $response;
}`;

    if (!isFull) return snippet;
    return `<?php\n\n${snippet}\n`;
}

// === ORCHESTRATOR ===
function processConversion() {
    const input = curlInput.value.trim();
    if (!input) {
        codeOutput.value = '';
        parseStatus.textContent = 'Masukkan perintah cURL untuk mengonversi';
        outputStatus.textContent = 'Menunggu input...';
        statusBadge.textContent = 'Siap';
        statusBadge.style.color = 'var(--text-muted)';
        return;
    }

    try {
        const parsed = parseCurl(input);
        if (!parsed || (!parsed.url && !parsed.method)) {
            codeOutput.value = '// Format cURL tidak dikenali. Pastikan diawali dengan `curl` atau mengandung URL.';
            parseStatus.textContent = 'Gagal mem-parse cURL';
            statusBadge.textContent = 'Syntax Error';
            statusBadge.style.color = 'var(--danger)';
            return;
        }

        const lang = langSelect.value;
        const isFull = fullSnippetToggle.checked;
        let generated = '';

        switch (lang) {
            case 'java-httpclient':
                generated = genJavaHttpClient(parsed, isFull);
                break;
            case 'java-resttemplate':
                generated = genJavaRestTemplate(parsed, isFull);
                break;
            case 'java-webclient':
                generated = genJavaWebClient(parsed, isFull);
                break;
            case 'java-okhttp':
                generated = genJavaOkHttp(parsed, isFull);
                break;
            case 'js-fetch':
                generated = genJsFetch(parsed, isFull);
                break;
            case 'js-axios':
                generated = genJsAxios(parsed, isFull);
                break;
            case 'python-requests':
                generated = genPythonRequests(parsed, isFull);
                break;
            case 'python-httpx':
                generated = genPythonHttpx(parsed, isFull);
                break;
            case 'go-nethttp':
                generated = genGoNetHttp(parsed, isFull);
                break;
            case 'php-curl':
                generated = genPhpCurl(parsed, isFull);
                break;
            default:
                generated = genJavaHttpClient(parsed, isFull);
        }

        codeOutput.value = generated;

        const headerCount = Object.keys(parsed.headers).length;
        const dataLength = parsed.data ? `${parsed.data.length} B payload` : 'No body';
        parseStatus.textContent = `${parsed.method} • ${headerCount} Header • ${dataLength}`;
        outputStatus.textContent = `Terkonversi ke ${langSelect.options[langSelect.selectedIndex].text}`;
        statusBadge.textContent = 'Sukses';
        statusBadge.style.color = 'var(--success)';
    } catch (err) {
        console.error('Error parsing curl:', err);
        codeOutput.value = `// Terjadi kesalahan saat memproses: ${err.message}`;
        parseStatus.textContent = 'Error parsing';
        statusBadge.textContent = 'Error';
        statusBadge.style.color = 'var(--danger)';
    }
}

// === EVENT LISTENERS ===
curlInput.addEventListener('input', processConversion);
langSelect.addEventListener('change', processConversion);
fullSnippetToggle.addEventListener('change', processConversion);

// Tombol Salin
copyBtn.addEventListener('click', async () => {
    const text = codeOutput.value;
    if (!text) return;

    try {
        await navigator.clipboard.writeText(text);
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✅ Tersalin!';
        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 2000);
    } catch (err) {
        // Fallback copy
        codeOutput.select();
        document.execCommand('copy');
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✅ Tersalin!';
        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 2000);
    }
});

// Auto-run saat pertama kali dibuka dengan contoh GET
curlInput.value = SAMPLE_GET;
processConversion();
