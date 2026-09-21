/**
 * Docker Run ⇄ Docker Compose Studio
 * 100% Client-Side Vanilla JavaScript
 * Robust CLI Tokenizer & YAML Generator
 */

(function () {
    'use strict';

    const el = (id) => document.getElementById(id);

    // ==========================================
    // 1. THEME TOGGLE
    // ==========================================
    const themeToggle = el('themeToggle');
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        if (themeToggle) {
            themeToggle.textContent = theme === 'dark' ? '🌙' : '☀️';
            themeToggle.setAttribute('title', theme === 'dark' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap');
        }
    }

    const savedTheme = localStorage.getItem('theme') ||
        (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    applyTheme(savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') || 'dark';
            applyTheme(current === 'dark' ? 'light' : 'dark');
        });
    }

    // ==========================================
    // 2. TABS MANAGEMENT
    // ==========================================
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabPanes = document.querySelectorAll('.tab-pane');

    function switchTab(tabId) {
        navTabs.forEach(tab => {
            tab.classList.toggle('active', tab.getAttribute('data-tab') === tabId);
        });
        tabPanes.forEach(pane => {
            pane.classList.toggle('active', pane.id === tabId);
        });
    }

    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.getAttribute('data-tab');
            switchTab(targetId);
        });
    });

    // ==========================================
    // 3. CLI TOKENIZER & DOCKER RUN PARSER
    // ==========================================

    /**
     * Tokenize CLI command taking care of quotes and escapes
     */
    function tokenizeCli(cmd) {
        // Strip line continuations: backslash or backtick at end of lines
        const cleaned = cmd
            .replace(/\\\r?\n/g, ' ')
            .replace(/`\r?\n/g, ' ')
            .trim();

        const tokens = [];
        let current = '';
        let inSingleQuote = false;
        let inDoubleQuote = false;

        for (let i = 0; i < cleaned.length; i++) {
            const char = cleaned[i];

            if (char === "'" && !inDoubleQuote) {
                inSingleQuote = !inSingleQuote;
            } else if (char === '"' && !inSingleQuote) {
                inDoubleQuote = !inDoubleQuote;
            } else if ((char === ' ' || char === '\t' || char === '\n') && !inSingleQuote && !inDoubleQuote) {
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

        return tokens;
    }

    /**
     * Parse Docker Run Tokens into structured service object
     */
    function parseDockerRun(rawCommand) {
        const tokens = tokenizeCli(rawCommand);
        if (tokens.length === 0) return null;

        // Skip leading 'docker' and 'run' or 'container run'
        let startIndex = 0;
        if (tokens[0] === 'docker') startIndex = 1;
        if (tokens[startIndex] === 'container' && tokens[startIndex + 1] === 'run') startIndex += 2;
        else if (tokens[startIndex] === 'run') startIndex += 1;

        const config = {
            containerName: '',
            image: '',
            restart: '',
            ports: [],
            volumes: [],
            environment: [],
            envFiles: [],
            networks: [],
            hostname: '',
            user: '',
            workdir: '',
            entrypoint: '',
            privileged: false,
            capAdd: [],
            capDrop: [],
            shmSize: '',
            cpus: '',
            memory: '',
            dns: [],
            commandArgs: []
        };

        let i = startIndex;
        let imageFound = false;

        while (i < tokens.length) {
            const token = tokens[i];

            if (!imageFound) {
                // If it's a flag
                if (token.startsWith('-')) {
                    // Container name
                    if (token === '--name') {
                        config.containerName = tokens[++i] || '';
                    } else if (token.startsWith('--name=')) {
                        config.containerName = token.split('=')[1];
                    }
                    // Ports
                    else if (token === '-p' || token === '--publish') {
                        if (tokens[i + 1]) config.ports.push(tokens[++i]);
                    } else if (token.startsWith('-p=') || token.startsWith('--publish=')) {
                        config.ports.push(token.split('=')[1]);
                    }
                    // Volumes
                    else if (token === '-v' || token === '--volume') {
                        if (tokens[i + 1]) config.volumes.push(tokens[++i]);
                    } else if (token.startsWith('-v=') || token.startsWith('--volume=')) {
                        config.volumes.push(token.split('=')[1]);
                    }
                    // Environment
                    else if (token === '-e' || token === '--env') {
                        if (tokens[i + 1]) config.environment.push(tokens[++i]);
                    } else if (token.startsWith('-e=') || token.startsWith('--env=')) {
                        config.environment.push(token.split('=')[1]);
                    }
                    // Env file
                    else if (token === '--env-file') {
                        if (tokens[i + 1]) config.envFiles.push(tokens[++i]);
                    } else if (token.startsWith('--env-file=')) {
                        config.envFiles.push(token.split('=')[1]);
                    }
                    // Restart
                    else if (token === '--restart') {
                        config.restart = tokens[++i] || '';
                    } else if (token.startsWith('--restart=')) {
                        config.restart = token.split('=')[1];
                    }
                    // Network
                    else if (token === '--net' || token === '--network') {
                        if (tokens[i + 1]) config.networks.push(tokens[++i]);
                    } else if (token.startsWith('--net=') || token.startsWith('--network=')) {
                        config.networks.push(token.split('=')[1]);
                    }
                    // Hostname
                    else if (token === '-h' || token === '--hostname') {
                        config.hostname = tokens[++i] || '';
                    } else if (token.startsWith('--hostname=')) {
                        config.hostname = token.split('=')[1];
                    }
                    // User
                    else if (token === '-u' || token === '--user') {
                        config.user = tokens[++i] || '';
                    } else if (token.startsWith('--user=')) {
                        config.user = token.split('=')[1];
                    }
                    // Workdir
                    else if (token === '-w' || token === '--workdir') {
                        config.workdir = tokens[++i] || '';
                    } else if (token.startsWith('--workdir=')) {
                        config.workdir = token.split('=')[1];
                    }
                    // Entrypoint
                    else if (token === '--entrypoint') {
                        config.entrypoint = tokens[++i] || '';
                    } else if (token.startsWith('--entrypoint=')) {
                        config.entrypoint = token.split('=')[1];
                    }
                    // Privileged
                    else if (token === '--privileged') {
                        config.privileged = true;
                    }
                    // Capabilities
                    else if (token === '--cap-add') {
                        if (tokens[i + 1]) config.capAdd.push(tokens[++i]);
                    } else if (token === '--cap-drop') {
                        if (tokens[i + 1]) config.capDrop.push(tokens[++i]);
                    }
                    // Resources
                    else if (token === '-m' || token === '--memory') {
                        config.memory = tokens[++i] || '';
                    } else if (token === '--cpus') {
                        config.cpus = tokens[++i] || '';
                    } else if (token === '--shm-size') {
                        config.shmSize = tokens[++i] || '';
                    }
                    // DNS
                    else if (token === '--dns') {
                        if (tokens[i + 1]) config.dns.push(tokens[++i]);
                    }
                    // Boolean flags to ignore (e.g. -d, --rm, -it, -i, -t)
                    else if (['-d', '--detach', '--rm', '-it', '-i', '-t'].includes(token)) {
                        // detached or interactive flag handled implicitly
                    }
                } else {
                    // Non-flag token: this must be the IMAGE!
                    config.image = token;
                    imageFound = true;
                }
            } else {
                // Any tokens after the image are the container command / arguments!
                config.commandArgs.push(token);
            }

            i++;
        }

        return config;
    }

    /**
     * Generate clean YAML representation of docker-compose
     */
    function generateDockerComposeYaml(config, options = {}) {
        if (!config || !config.image) {
            return '# Masukkan perintah docker run yang valid untuk menghasilkan docker-compose.yml';
        }

        const {
            includeVersion = true,
            includeVolumesBlock = true,
            includeNetworksBlock = true
        } = options;

        // Determine service key name
        let serviceName = config.containerName;
        if (!serviceName) {
            // Derive from image name: e.g. postgres:16-alpine -> postgres
            const imgWithoutHost = config.image.split('/').pop();
            serviceName = imgWithoutHost.split(':')[0] || 'app';
        }
        serviceName = serviceName.toLowerCase().replace(/[^a-z0-9_-]/g, '-');

        const lines = [];

        if (includeVersion) {
            lines.push("version: '3.8'");
            lines.push("");
        }

        lines.push("services:");
        lines.push(`  ${serviceName}:`);
        lines.push(`    image: ${config.image}`);

        if (config.containerName) {
            lines.push(`    container_name: ${config.containerName}`);
        }

        if (config.restart) {
            lines.push(`    restart: ${config.restart}`);
        }

        if (config.privileged) {
            lines.push(`    privileged: true`);
        }

        if (config.hostname) {
            lines.push(`    hostname: ${config.hostname}`);
        }

        if (config.user) {
            lines.push(`    user: ${config.user}`);
        }

        if (config.workdir) {
            lines.push(`    working_dir: ${config.workdir}`);
        }

        if (config.entrypoint) {
            lines.push(`    entrypoint: ${config.entrypoint}`);
        }

        if (config.shmSize) {
            lines.push(`    shm_size: ${config.shmSize}`);
        }

        // Ports
        if (config.ports.length > 0) {
            lines.push("    ports:");
            config.ports.forEach(p => {
                lines.push(`      - "${p}"`);
            });
        }

        // Environment variables
        if (config.environment.length > 0) {
            lines.push("    environment:");
            config.environment.forEach(e => {
                lines.push(`      - ${e}`);
            });
        }

        // Env file
        if (config.envFiles.length > 0) {
            lines.push("    env_file:");
            config.envFiles.forEach(ef => {
                lines.push(`      - ${ef}`);
            });
        }

        // Volumes
        const namedVolumes = new Set();
        if (config.volumes.length > 0) {
            lines.push("    volumes:");
            config.volumes.forEach(v => {
                lines.push(`      - ${v}`);
                // Check if named volume (doesn't start with ./ or / or ~)
                const hostPart = v.split(':')[0];
                if (hostPart && !hostPart.startsWith('/') && !hostPart.startsWith('./') && !hostPart.startsWith('../') && !hostPart.startsWith('~')) {
                    namedVolumes.add(hostPart);
                }
            });
        }

        // Networks
        const customNetworks = new Set();
        if (config.networks.length > 0) {
            lines.push("    networks:");
            config.networks.forEach(net => {
                lines.push(`      - ${net}`);
                if (net !== 'bridge' && net !== 'host' && net !== 'none') {
                    customNetworks.add(net);
                }
            });
        }

        // Capabilities
        if (config.capAdd.length > 0) {
            lines.push("    cap_add:");
            config.capAdd.forEach(c => lines.push(`      - ${c}`));
        }
        if (config.capDrop.length > 0) {
            lines.push("    cap_drop:");
            config.capDrop.forEach(c => lines.push(`      - ${c}`));
        }

        // DNS
        if (config.dns.length > 0) {
            lines.push("    dns:");
            config.dns.forEach(d => lines.push(`      - ${d}`));
        }

        // Resources
        if (config.memory || config.cpus) {
            lines.push("    deploy:");
            lines.push("      resources:");
            lines.push("        limits:");
            if (config.cpus) lines.push(`          cpus: '${config.cpus}'`);
            if (config.memory) lines.push(`          memory: ${config.memory}`);
        }

        // Command arguments
        if (config.commandArgs.length > 0) {
            const cmdStr = config.commandArgs.join(' ');
            lines.push(`    command: ${cmdStr}`);
        }

        // Top-level Named Volumes block
        if (includeVolumesBlock && namedVolumes.size > 0) {
            lines.push("");
            lines.push("volumes:");
            namedVolumes.forEach(vol => {
                lines.push(`  ${vol}:`);
            });
        }

        // Top-level Networks block
        if (includeNetworksBlock && customNetworks.size > 0) {
            lines.push("");
            lines.push("networks:");
            customNetworks.forEach(net => {
                lines.push(`  ${net}:`);
                lines.push(`    external: true`);
            });
        }

        return lines.join('\n');
    }

    // ==========================================
    // 4. RUN TO COMPOSE CONTROLS
    // ==========================================

    const dockerRunInput = el('dockerRunInput');
    const composeOutput = el('composeOutput');
    const optIncludeVersion = el('optIncludeVersion');
    const optIncludeVolumesBlock = el('optIncludeVolumesBlock');
    const optIncludeNetworksBlock = el('optIncludeNetworksBlock');
    const btnCopyCompose = el('btnCopyCompose');
    const btnDownloadCompose = el('btnDownloadCompose');
    const btnClearRunInput = el('btnClearRunInput');
    const btnPasteRun = el('btnPasteRun');
    const runInputStats = el('runInputStats');
    const composeOutputStats = el('composeOutputStats');

    function executeRunToCompose() {
        const input = dockerRunInput.value.trim();
        if (!input) {
            composeOutput.value = '';
            runInputStats.textContent = 'Menunggu input perintah docker run...';
            composeOutputStats.textContent = 'Kosong';
            return;
        }

        const config = parseDockerRun(input);
        const options = {
            includeVersion: optIncludeVersion.checked,
            includeVolumesBlock: optIncludeVolumesBlock.checked,
            includeNetworksBlock: optIncludeNetworksBlock.checked
        };

        const yaml = generateDockerComposeYaml(config, options);
        composeOutput.value = yaml;

        if (config && config.image) {
            runInputStats.textContent = `✅ Image terdeteksi: ${config.image}`;
            composeOutputStats.textContent = `YAML dibuat (${yaml.split('\n').length} baris)`;
        } else {
            runInputStats.textContent = '⚠️ Tidak ditemukan nama image yang valid.';
            composeOutputStats.textContent = 'Harap periksa kembali sintaks perintah.';
        }
    }

    [dockerRunInput, optIncludeVersion, optIncludeVolumesBlock, optIncludeNetworksBlock].forEach(input => {
        input?.addEventListener('input', executeRunToCompose);
        input?.addEventListener('change', executeRunToCompose);
    });

    if (btnPasteRun) {
        btnPasteRun.addEventListener('click', async () => {
            try {
                const text = await navigator.clipboard.readText();
                if (text) {
                    dockerRunInput.value = text.trim();
                    executeRunToCompose();
                    showToast('📋 Perintah berhasil di-paste!');
                }
            } catch (err) {
                dockerRunInput.focus();
                showToast('Silakan paste manual (Ctrl+V / Cmd+V)', 'warning');
            }
        });
    }

    if (btnClearRunInput) {
        btnClearRunInput.addEventListener('click', () => {
            dockerRunInput.value = '';
            executeRunToCompose();
        });
    }

    if (btnCopyCompose) {
        btnCopyCompose.addEventListener('click', () => {
            const val = composeOutput.value;
            if (!val) return;
            navigator.clipboard.writeText(val).then(() => {
                showToast('📋 File docker-compose.yml disalin!');
            });
        });
    }

    if (btnDownloadCompose) {
        btnDownloadCompose.addEventListener('click', () => {
            const val = composeOutput.value;
            if (!val) {
                showToast('Tidak ada konten YAML untuk diunduh.', 'warning');
                return;
            }
            const blob = new Blob([val], { type: 'text/yaml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'docker-compose.yml';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('💾 Berkas docker-compose.yml berhasil diunduh!');
        });
    }

    // Quick Presets in Generator
    document.querySelectorAll('.preset-btn[data-preset]').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.getAttribute('data-preset');
            if (type === 'postgres') {
                dockerRunInput.value = `docker run -d \\
  --name postgres-db \\
  -p 5432:5432 \\
  -v pgdata:/var/lib/postgresql/data \\
  -e POSTGRES_USER=admin \\
  -e POSTGRES_PASSWORD=secret123 \\
  -e POSTGRES_DB=appdb \\
  --restart unless-stopped \\
  postgres:16-alpine`;
            } else if (type === 'mysql') {
                dockerRunInput.value = `docker run -d \\
  --name mysql-server \\
  -p 3306:3306 \\
  -v mysql_data:/var/lib/mysql \\
  -e MYSQL_ROOT_PASSWORD=rootpassword \\
  -e MYSQL_DATABASE=app_database \\
  -e MYSQL_USER=dbuser \\
  -e MYSQL_PASSWORD=dbpassword \\
  --restart always \\
  mysql:8.0`;
            } else if (type === 'redis') {
                dockerRunInput.value = `docker run -d \\
  --name redis-server \\
  -p 6379:6379 \\
  -v redis_cache:/data \\
  --restart unless-stopped \\
  redis:7-alpine redis-server --appendonly yes --requirepass mysecret`;
            } else if (type === 'nginx') {
                dockerRunInput.value = `docker run -d \\
  --name nginx-web \\
  -p 80:80 \\
  -p 443:443 \\
  -v ./nginx.conf:/etc/nginx/nginx.conf:ro \\
  -v ./certs:/etc/nginx/certs:ro \\
  --restart always \\
  nginx:alpine`;
            } else if (type === 'rabbitmq') {
                dockerRunInput.value = `docker run -d \\
  --name rabbitmq-broker \\
  -p 5672:5672 \\
  -p 15672:15672 \\
  -v rabbitmq_data:/var/lib/rabbitmq \\
  -e RABBITMQ_DEFAULT_USER=admin \\
  -e RABBITMQ_DEFAULT_PASS=adminpassword \\
  --hostname rabbit-node1 \\
  --restart unless-stopped \\
  rabbitmq:3-management-alpine`;
            } else if (type === 'mongo') {
                dockerRunInput.value = `docker run -d \\
  --name mongodb-instance \\
  -p 27017:27017 \\
  -v mongo_data:/data/db \\
  -e MONGO_INITDB_ROOT_USERNAME=mongoadmin \\
  -e MONGO_INITDB_ROOT_PASSWORD=mongopass \\
  --restart unless-stopped \\
  mongo:7.0`;
            }
            executeRunToCompose();
            showToast(`Preset ${type.toUpperCase()} dimuat!`);
        });
    });

    // ==========================================
    // 5. REVERSE: COMPOSE TO DOCKER RUN
    // ==========================================

    const composeToRunInput = el('composeToRunInput');
    const runCommandOutput = el('runCommandOutput');
    const selectServiceToRun = el('selectServiceToRun');
    const btnSampleCompose = el('btnSampleCompose');
    const btnClearComposeInput = el('btnClearComposeInput');
    const btnCopyRunCommand = el('btnCopyRunCommand');

    /**
     * Simple YAML parser tailored for Docker Compose services
     */
    function parseComposeYaml(yamlText) {
        const lines = yamlText.split('\n');
        const services = {};
        let inServices = false;
        let currentService = null;
        let currentKey = null;

        for (let rawLine of lines) {
            const trimmed = rawLine.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;

            const indent = rawLine.search(/\S/);

            if (trimmed === 'services:') {
                inServices = true;
                currentService = null;
                continue;
            }

            if (!inServices) continue;

            // Service definition level (indent 2 or 4)
            if (indent === 2 || (indent === 4 && rawLine.endsWith(':') && !rawLine.includes(' '))) {
                if (rawLine.endsWith(':')) {
                    currentService = trimmed.slice(0, -1).trim();
                    services[currentService] = {
                        image: '',
                        container_name: '',
                        ports: [],
                        volumes: [],
                        environment: [],
                        restart: '',
                        command: '',
                        networks: []
                    };
                    currentKey = null;
                    continue;
                }
            }

            if (currentService && services[currentService]) {
                const s = services[currentService];

                if (trimmed.startsWith('-') && currentKey) {
                    const itemVal = trimmed.replace(/^-\s*/, '').replace(/^['"]|['"]$/g, '');
                    if (currentKey === 'ports') s.ports.push(itemVal);
                    else if (currentKey === 'volumes') s.volumes.push(itemVal);
                    else if (currentKey === 'environment') s.environment.push(itemVal);
                    else if (currentKey === 'networks') s.networks.push(itemVal);
                    continue;
                }

                if (trimmed.includes(':')) {
                    const parts = trimmed.split(':');
                    const key = parts[0].trim();
                    const val = parts.slice(1).join(':').trim().replace(/^['"]|['"]$/g, '');

                    currentKey = key;
                    if (key === 'image') s.image = val;
                    else if (key === 'container_name') s.container_name = val;
                    else if (key === 'restart') s.restart = val;
                    else if (key === 'command') s.command = val;
                }
            }
        }

        return services;
    }

    function executeComposeToRun() {
        const yaml = composeToRunInput.value.trim();
        if (!yaml) {
            runCommandOutput.value = '';
            selectServiceToRun.innerHTML = '<option value="">(Otomatis)</option>';
            return;
        }

        const services = parseComposeYaml(yaml);
        const serviceNames = Object.keys(services);

        // Update select dropdown
        const prevSelected = selectServiceToRun.value;
        selectServiceToRun.innerHTML = '';
        serviceNames.forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            selectServiceToRun.appendChild(opt);
        });

        if (serviceNames.length > 0) {
            const activeService = serviceNames.includes(prevSelected) ? prevSelected : serviceNames[0];
            selectServiceToRun.value = activeService;
            generateRunCommandForService(services[activeService], activeService);
        } else {
            runCommandOutput.value = '# Format Compose YAML tidak dapat dibaca atau blok services tidak ditemukan.';
        }
    }

    function generateRunCommandForService(service, name) {
        if (!service) return;

        const cmdParts = ['docker run -d'];

        if (service.container_name) {
            cmdParts.push(`  --name ${service.container_name}`);
        } else if (name) {
            cmdParts.push(`  --name ${name}`);
        }

        if (service.restart) {
            cmdParts.push(`  --restart ${service.restart}`);
        }

        if (service.ports && service.ports.length > 0) {
            service.ports.forEach(p => cmdParts.push(`  -p ${p}`));
        }

        if (service.volumes && service.volumes.length > 0) {
            service.volumes.forEach(v => cmdParts.push(`  -v ${v}`));
        }

        if (service.environment && service.environment.length > 0) {
            service.environment.forEach(e => cmdParts.push(`  -e ${e}`));
        }

        if (service.networks && service.networks.length > 0) {
            service.networks.forEach(net => cmdParts.push(`  --network ${net}`));
        }

        if (service.image) {
            cmdParts.push(`  ${service.image}`);
        } else {
            cmdParts.push(`  <image-name>`);
        }

        if (service.command) {
            cmdParts.push(`  ${service.command}`);
        }

        runCommandOutput.value = cmdParts.join(' \\\n');
    }

    composeToRunInput?.addEventListener('input', executeComposeToRun);

    selectServiceToRun?.addEventListener('change', () => {
        const services = parseComposeYaml(composeToRunInput.value);
        const activeService = selectServiceToRun.value;
        if (services[activeService]) {
            generateRunCommandForService(services[activeService], activeService);
        }
    });

    if (btnSampleCompose) {
        btnSampleCompose.addEventListener('click', () => {
            composeToRunInput.value = `services:
  redis:
    image: redis:7-alpine
    container_name: redis-cache
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    environment:
      - REDIS_PASSWORD=secret123
    restart: always
    command: redis-server --appendonly yes`;
            executeComposeToRun();
            showToast('Contoh docker-compose dimuat!');
        });
    }

    if (btnClearComposeInput) {
        btnClearComposeInput.addEventListener('click', () => {
            composeToRunInput.value = '';
            executeComposeToRun();
        });
    }

    if (btnCopyRunCommand) {
        btnCopyRunCommand.addEventListener('click', () => {
            const val = runCommandOutput.value;
            if (!val) return;
            navigator.clipboard.writeText(val).then(() => {
                showToast('📋 Perintah docker run disalin ke clipboard!');
            });
        });
    }

    // ==========================================
    // 6. BACKEND DATABASE PRESETS TAB
    // ==========================================

    const FULL_PRESETS = {
        'postgres-pgadmin': `version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: postgres-db
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=admin
      - POSTGRES_PASSWORD=secret123
      - POSTGRES_DB=maindb
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: pgadmin-web
    restart: unless-stopped
    ports:
      - "5050:80"
    environment:
      - PGADMIN_DEFAULT_EMAIL=admin@example.com
      - PGADMIN_DEFAULT_PASSWORD=adminpassword
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    networks:
      - app-network
    depends_on:
      - postgres

volumes:
  postgres_data:
  pgadmin_data:

networks:
  app-network:
    driver: bridge`,

        'mysql-phpmyadmin': `version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: mysql-db
    restart: always
    ports:
      - "3306:3306"
    environment:
      - MYSQL_ROOT_PASSWORD=rootsecret
      - MYSQL_DATABASE=app_database
      - MYSQL_USER=dbuser
      - MYSQL_PASSWORD=dbpassword
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - app-network

  phpmyadmin:
    image: phpmyadmin/phpmyadmin:latest
    container_name: phpmyadmin-web
    restart: always
    ports:
      - "8080:80"
    environment:
      - PMA_HOST=mysql
      - PMA_PORT=3306
    networks:
      - app-network
    depends_on:
      - mysql

volumes:
  mysql_data:

networks:
  app-network:
    driver: bridge`,

        'redis-commander': `version: '3.8'

services:
  redis:
    image: redis:7-alpine
    container_name: redis-cache
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --requirepass myredispassword
    networks:
      - app-network

  redis-commander:
    image: rediscommander/redis-commander:latest
    container_name: redis-commander-ui
    restart: unless-stopped
    ports:
      - "8081:8081"
    environment:
      - REDIS_HOSTS=local:redis:6379:0:myredispassword
    networks:
      - app-network
    depends_on:
      - redis

volumes:
  redis_data:

networks:
  app-network:
    driver: bridge`,

        'rabbitmq-mgmt': `version: '3.8'

services:
  rabbitmq:
    image: rabbitmq:3-management-alpine
    container_name: rabbitmq-broker
    restart: unless-stopped
    ports:
      - "5672:5672"    # AMQP protocol
      - "15672:15672"  # Management UI
    environment:
      - RABBITMQ_DEFAULT_USER=admin
      - RABBITMQ_DEFAULT_PASS=adminsecret
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    networks:
      - app-network

volumes:
  rabbitmq_data:

networks:
  app-network:
    driver: bridge`,

        'mongo-express': `version: '3.8'

services:
  mongo:
    image: mongo:7.0
    container_name: mongo-db
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=mongoadmin
      - MONGO_INITDB_ROOT_PASSWORD=mongosecret
    volumes:
      - mongo_data:/data/db
    networks:
      - app-network

  mongo-express:
    image: mongo-express:latest
    container_name: mongo-express-ui
    restart: unless-stopped
    ports:
      - "8081:8081"
    environment:
      - ME_CONFIG_MONGODB_ADMINUSERNAME=mongoadmin
      - ME_CONFIG_MONGODB_ADMINPASSWORD=mongosecret
      - ME_CONFIG_MONGODB_SERVER=mongo
      - ME_CONFIG_BASICAUTH_USERNAME=admin
      - ME_CONFIG_BASICAUTH_PASSWORD=adminpass
    networks:
      - app-network
    depends_on:
      - mongo

volumes:
  mongo_data:

networks:
  app-network:
    driver: bridge`,

        'nginx-proxy': `version: '3.8'

services:
  nginx:
    image: nginx:alpine
    container_name: nginx-reverse-proxy
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./conf.d:/etc/nginx/conf.d:ro
      - ./certs:/etc/nginx/certs:ro
    networks:
      - app-network

networks:
  app-network:
    driver: bridge`
    };

    document.querySelectorAll('.load-full-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            const presetId = btn.getAttribute('data-id');
            const yaml = FULL_PRESETS[presetId];
            if (!yaml) return;

            // Switch to Compose to Run or copy to compose
            switchTab('tab-compose-to-run');
            composeToRunInput.value = yaml;
            executeComposeToRun();
            showToast('Template berhasil dimuat di tab Compose!');
        });
    });

    // ==========================================
    // 7. TOAST UTILITY
    // ==========================================

    let toastTimer = null;
    function showToast(msg, type = 'info') {
        const toast = el('toast');
        if (!toast) return;
        toast.textContent = msg;
        toast.className = `toast show ${type}`;

        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toast.classList.remove('show');
        }, 2800);
    }

    // Initialize
    executeRunToCompose();
    executeComposeToRun();

})();
