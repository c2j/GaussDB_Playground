# Installation Module - L3 Lab: Advanced Installation and Configuration

## Lab Overview

In this L3 (Advanced Level) lab, you will practice advanced installation and configuration techniques for GaussDB, including:
- Multi-instance configuration
- Custom compilation and optimization
- Advanced parameter tuning
- Security hardening during installation
- Performance-optimized deployment

**Time Required**: 50 minutes
**Prerequisites**: Completed L1 and L2 Installation Labs, root/sudo access

## Learning Objectives

By completing this lab, you will be able to:
- Install and configure multiple GaussDB instances
- Compile GaussDB from source with custom optimizations
- Tune configuration for specific workloads
- Harden security during deployment
- Optimize performance through configuration

## Lab Tasks

### Task 1: Multi-Instance Configuration

Run multiple GaussDB instances on the same server.

**Check current instance**:
```bash
# Check running GaussDB instances
ps aux | grep gaussdb
netstat -tlnp | grep 5432

# Check data directory
echo $PGDATA
ls -la $PGDATA | head -20
```

[[bash -c "ps aux | grep gaussdb | head -5; netstat -tlnp 2>/dev/null | grep 5432 || lsof -i :5432 | head -5; echo \$PGDATA; ls -la /var/lib/pgsql 2>/dev/null || ls -la /usr/local/pgsql/data 2>/dev/null | head -20"]]{{RUN}}

**Create second instance directory structure**:
```bash
# Create directories for second instance
sudo mkdir -p /usr/local/pgsql/data2
sudo chown postgres:postgres /usr/local/pgsql/data2
sudo chmod 700 /usr/local/pgsql/data2

# Create log directory
sudo mkdir -p /var/log/pgsql2
sudo chown postgres:postgres /var/log/pgsql2
```

[[bash -c "sudo mkdir -p /usr/local/pgsql/data2 && sudo chown postgres:postgres /usr/local/pgsql/data2 && sudo chmod 700 /usr/local/pgsql/data2 && sudo mkdir -p /var/log/pgsql2 && sudo chown postgres:postgres /var/log/pgsql2"]]{{RUN}}

**Initialize second instance**:
```bash
# Switch to postgres user
sudo -u postgres /usr/local/pgsql/bin/initdb -D /usr/local/pgsql/data2

# Check initialization
ls -la /usr/local/pgsql/data2
```

[[bash -c "sudo -u postgres /usr/local/pgsql/bin/initdb -D /usr/local/pgsql/data2 && ls -la /usr/local/pgsql/data2"]]{{RUN}}

**Configure second instance**:
```bash
# Configure port for second instance (use different port)
echo "port = 5433" | sudo tee -a /usr/local/pgsql/data2/postgresql.conf
echo "unix_socket_directories = '/tmp'" | sudo tee -a /usr/local/pgsql/data2/postgresql.conf
echo "max_connections = 100" | sudo tee -a /usr/local/pgsql/data2/postgresql.conf

# Check configuration
grep -E "^port|^unix_socket|^max_connections" /usr/local/pgsql/data2/postgresql.conf
```

[[bash -c "echo \"port = 5433\" | sudo tee -a /usr/local/pgsql/data2/postgresql.conf && echo \"unix_socket_directories = '/tmp'\" | sudo tee -a /usr/local/pgsql/data2/postgresql.conf && echo \"max_connections = 100\" | sudo tee -a /usr/local/pgsql/data2/postgresql.conf && grep -E \"^port|^unix_socket|^max_connections\" /usr/local/pgsql/data2/postgresql.conf"]]{{RUN}}

**Start second instance**:
```bash
# Start second instance
sudo -u postgres /usr/local/pgsql/bin/pg_ctl -D /usr/local/pgsql/data2 -l /var/log/pgsql2/pg.log start

# Verify both instances are running
ps aux | grep postgres | grep -E "5432|5433"
netstat -tlnp 2>/dev/null | grep -E "5432|5433" || lsof -i :5432 -i :5433
```

[[bash -c "sudo -u postgres /usr/local/pgsql/bin/pg_ctl -D /usr/local/pgsql/data2 -l /var/log/pgsql2/pg.log start && sleep 2 && ps aux | grep postgres | grep -E \"5432|5433\" && netstat -tlnp 2>/dev/null | grep -E \"5432|5433\" || lsof -i :5432 -i :5433"]]{{RUN}}

**Test connectivity to both instances**:
```bash
# Connect to first instance (port 5432)
psql -h localhost -p 5432 -U postgres -c "SELECT version(), inet_server_addr(), inet_server_port();"

# Connect to second instance (port 5433)
psql -h localhost -p 5433 -U postgres -c "SELECT version(), inet_server_addr(), inet_server_port();"
```

[[bash -c "psql -h localhost -p 5432 -U postgres -c \"SELECT version(), inet_server_addr(), inet_server_port();\" && psql -h localhost -p 5433 -U postgres -c \"SELECT version(), inet_server_addr(), inet_server_port();\""]]{{RUN}}

**What to observe**:
- Multiple instances require separate data directories and ports
- Each instance is independent with its own configuration
- Useful for development, testing, and resource isolation

---

### Task 2: Advanced Parameter Tuning

Optimize configuration for specific workload patterns.

**Check current configuration**:
```bash
# Display all parameters
psql -h localhost -p 5432 -U postgres -c "SHOW ALL;" | head -30

# Check memory-related parameters
psql -h localhost -p 5432 -U postgres -c "SHOW shared_buffers; SHOW effective_cache_size; SHOW work_mem; SHOW maintenance_work_mem;"
```

[[bash -c "psql -h localhost -p 5432 -U postgres -c \"SHOW ALL;\" | head -30 && psql -h localhost -p 5432 -U postgres -c \"SHOW shared_buffers; SHOW effective_cache_size; SHOW work_mem; SHOW maintenance_work_mem;\""]]{{RUN}}

**Optimize for OLTP workload**:
```bash
# Create OLTP-optimized configuration
cat > /tmp/oltp_tuning.conf <<'CONFIG'
# Memory Configuration (assuming 8GB RAM)
shared_buffers = 2GB
effective_cache_size = 6GB
work_mem = 64MB
maintenance_work_mem = 256MB

# Connection Settings
max_connections = 200
superuser_reserved_connections = 3

# WAL Configuration
wal_level = replica
wal_buffers = 32MB
min_wal_size = 1GB
max_wal_size = 4GB
checkpoint_completion_target = 0.9

# Query Planning
random_page_cost = 1.1
effective_io_concurrency = 200

# Autovacuum
autovacuum_max_workers = 4
autovacuum_naptime = 10s
CONFIG

cat /tmp/oltp_tuning.conf
```

[[bash -c "cat > /tmp/oltp_tuning.conf <<'CONFIG'
shared_buffers = 2GB
effective_cache_size = 6GB
work_mem = 64MB
maintenance_work_mem = 256MB
max_connections = 200
superuser_reserved_connections = 3
wal_level = replica
wal_buffers = 32MB
min_wal_size = 1GB
max_wal_size = 4GB
checkpoint_completion_target = 0.9
random_page_cost = 1.1
effective_io_concurrency = 200
autovacuum_max_workers = 4
autovacuum_naptime = 10s
CONFIG
cat /tmp/oltp_tuning.conf"]]{{RUN}}

**Optimize for OLAP workload**:
```bash
# Create OLAP-optimized configuration
cat > /tmp/olap_tuning.conf <<'CONFIG'
# Memory Configuration (assuming 8GB RAM)
shared_buffers = 2GB
effective_cache_size = 6GB
work_mem = 256MB
maintenance_work_mem = 512MB

# Connection Settings
max_connections = 50
superuser_reserved_connections = 2

# WAL Configuration
wal_level = replica
wal_buffers = 16MB
min_wal_size = 512MB
max_wal_size = 2GB
checkpoint_completion_target = 0.7

# Query Planning
random_page_cost = 1.0
effective_io_concurrency = 1

# Autovacuum
autovacuum_max_workers = 2
autovacuum_naptime = 30s
CONFIG

cat /tmp/olap_tuning.conf
```

[[bash -c "cat > /tmp/olap_tuning.conf <<'CONFIG'
shared_buffers = 2GB
effective_cache_size = 6GB
work_mem = 256MB
maintenance_work_mem = 512MB
max_connections = 50
superuser_reserved_connections = 2
wal_level = replica
wal_buffers = 16MB
min_wal_size = 512MB
max_wal_size = 2GB
checkpoint_completion_target = 0.7
random_page_cost = 1.0
effective_io_concurrency = 1
autovacuum_max_workers = 2
autovacuum_naptime = 30s
CONFIG
cat /tmp/olap_tuning.conf"]]{{RUN}}

**Apply configuration to second instance**:
```bash
# Copy OLTP configuration to second instance
sudo cp /tmp/oltp_tuning.conf /usr/local/pgsql/data2/custom.conf

# Update main config to include custom config
echo "include 'custom.conf'" | sudo tee -a /usr/local/pgsql/data2/postgresql.conf

# Reload configuration
sudo -u postgres /usr/local/pgsql/bin/pg_ctl -D /usr/local/pgsql/data2 reload

# Verify settings applied
psql -h localhost -p 5433 -U postgres -c "SHOW shared_buffers; SHOW work_mem; SHOW max_connections;"
```

[[bash -c "sudo cp /tmp/oltp_tuning.conf /usr/local/pgsql/data2/custom.conf && echo \"include 'custom.conf'\" | sudo tee -a /usr/local/pgsql/data2/postgresql.conf && sudo -u postgres /usr/local/pgsql/bin/pg_ctl -D /usr/local/pgsql/data2 reload && sleep 2 && psql -h localhost -p 5433 -U postgres -c \"SHOW shared_buffers; SHOW work_mem; SHOW max_connections;\""]]{{RUN}}

**What to observe**:
- Different workloads require different configurations
- OLTP: Higher connections, lower work_mem
- OLAP: Lower connections, higher work_mem for aggregations
- Settings must be appropriate for hardware

---

### Task 3: Security Hardening Configuration

Apply security best practices during installation.

**Create security-hardened configuration**:
```bash
cat > /tmp/security_hardening.conf <<'CONFIG'
# Connection Security
listen_addresses = 'localhost'  # Restrict to localhost
port = 5432

# Authentication
password_encryption = 'scram-sha-256'

# SSL/TLS
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'
ssl_ca_file = 'root.crt'
ssl_crl_file = 'root.crl'
ssl_min_protocol_version = 'TLSv1.2'

# Connection Limits
max_connections = 100
superuser_reserved_connections = 3

# Resource Limits
log_min_duration_statement = 1000  # Log slow queries (1 second)
log_duration = on
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '

# Monitoring
track_activities = on
track_counts = on
track_io_timing = on
track_functions = all
CONFIG

cat /tmp/security_hardening.conf
```

[[bash -c "cat > /tmp/security_hardening.conf <<'CONFIG'
listen_addresses = 'localhost'
port = 5432
password_encryption = 'scram-sha-256'
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'
ssl_ca_file = 'root.crt'
ssl_crl_file = 'root.crl'
ssl_min_protocol_version = 'TLSv1.2'
max_connections = 100
superuser_reserved_connections = 3
log_min_duration_statement = 1000
log_duration = on
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
track_activities = on
track_counts = on
track_io_timing = on
track_functions = all
CONFIG
cat /tmp/security_hardening.conf"]]{{RUN}}

**Configure pg_hba.conf for secure access**:
```bash
# Create secure pg_hba.conf
cat > /tmp/secure_pg_hba.conf <<'CONFIG'
# TYPE  DATABASE        USER            ADDRESS                 METHOD

# Local connections
local   all             postgres                                peer
local   all             all                                     scram-sha-256

# IPv4 local connections
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             10.0.0.0/8              scram-sha-256

# IPv6 local connections
host    all             all             ::1/128                  scram-sha-256

# Replication connections
host    replication     replicator      10.0.0.0/8              scram-sha-256
CONFIG

cat /tmp/secure_pg_hba.conf
```

[[bash -c "cat > /tmp/secure_pg_hba.conf <<'CONFIG'
local   all             postgres                                peer
local   all             all                                     scram-sha-256
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             10.0.0.0/8              scram-sha-256
host    all             all             ::1/128                  scram-sha-256
host    replication     replicator      10.0.0.0/8              scram-sha-256
CONFIG
cat /tmp/secure_pg_hba.conf"]]{{RUN}}

**Set up SSL certificates (development)**:
```bash
# Create self-signed certificate for testing (not for production!)
cd /tmp
openssl req -new -x509 -days 365 -nodes -text \
  -out server.crt -keyout server.key \
  -subj "/CN=localhost"

# Set proper permissions
chmod 600 server.key
chmod 644 server.crt

# Check certificate
openssl x509 -in server.crt -text -noout | head -20
```

[[bash -c "cd /tmp && openssl req -new -x509 -days 365 -nodes -text -out server.crt -keyout server.key -subj \"/CN=localhost\" && chmod 600 server.key && chmod 644 server.crt && openssl x509 -in server.crt -text -noout | head -20"]]{{RUN}}

**What to observe**:
- SSL/TLS encrypts data in transit
- Strong password algorithms (scram-sha-256) improve security
- Restricted access limits attack surface

---

### Task 4: Custom Compilation from Source

Compile GaussDB from source with custom optimizations.

**Check compiler and build tools**:
```bash
# Check compiler version
gcc --version
make --version

# Check for required libraries
which flex bison openssl zlib1g-dev libreadline-dev || \
    echo "Required build tools installed"
```

[[bash -c "gcc --version && make --version && which flex bison openssl zlib1g-dev libreadline-dev 2>/dev/null || echo \"Required build tools installed\""]]{{RUN}}

**Configure build options**:
```bash
# Create custom build configuration
cat > /tmp/build_gaussdb.sh <<'SCRIPT'
#!/bin/bash

# GaussDB source directory (adjust as needed)
GAUSSDB_SRC="/path/to/gaussdb/source"

# Installation directory
INSTALL_PREFIX="/usr/local/gaussdb-custom"

# Build with optimizations
cd "$GAUSSDB_SRC"

./configure \
    --prefix="$INSTALL_PREFIX" \
    --with-openssl \
    --with-pam \
    --with-ldap \
    --with-libxml \
    --with-libxslt \
    --with-perl \
    --with-python \
    --with-tcl \
    --enable-thread-safety \
    --enable-debug \
    --enable-cassert \
    CFLAGS="-O3 -march=native -pipe"

echo "Configuration complete. Ready to build."
SCRIPT

chmod +x /tmp/build_gaussdb.sh
cat /tmp/build_gaussdb.sh
```

[[bash -c "cat > /tmp/build_gaussdb.sh <<'SCRIPT'
#!/bin/bash
GAUSSDB_SRC=\"/path/to/gaussdb/source\"
INSTALL_PREFIX=\"/usr/local/gaussdb-custom\"
cd \"\$GAUSSDB_SRC\"
./configure \
    --prefix=\"\$INSTALL_PREFIX\" \
    --with-openssl \
    --with-pam \
    --with-ldap \
    --with-libxml \
    --with-libxslt \
    --with-perl \
    --with-python \
    --with-tcl \
    --enable-thread-safety \
    --enable-debug \
    --enable-cassert \
    CFLAGS=\"-O3 -march=native -pipe\"
echo \"Configuration complete. Ready to build.\"
SCRIPT
chmod +x /tmp/build_gaussdb.sh && cat /tmp/build_gaussdb.sh"]]{{RUN}}

**Build and install (simulation)**:
```bash
echo "Build process (simulated):"
echo "1. Configure completed"
echo "2. Running make..."
echo "3. Running make install..."
echo ""
echo "Custom GaussDB installation complete at: /usr/local/gaussdb-custom"
echo ""
echo "Key benefits of custom compilation:"
echo "- Optimized for specific CPU architecture"
echo "- Enables debug features for troubleshooting"
echo "- Includes optional extensions and features"
echo "- Allows fine-tuning build options"
```

[[bash -c "echo \"Build process (simulated):\" && echo \"1. Configure completed\" && echo \"2. Running make...\" && echo \"3. Running make install...\" && echo \"\" && echo \"Custom GaussDB installation complete at: /usr/local/gaussdb-custom\" && echo \"\" && echo \"Key benefits of custom compilation:\" && echo \"- Optimized for specific CPU architecture\" && echo \"- Enables debug features for troubleshooting\" && echo \"- Includes optional extensions and features\" && echo \"- Allows fine-tuning build options\""]]{{RUN}}

**What to observe**:
- Custom compilation optimizes for specific hardware
- Build options control features and performance
- Debug builds aid troubleshooting but are slower

---

### Task 5: Performance Profiling Setup

Set up profiling tools for installation verification.

**Install performance monitoring tools**:
```bash
# Check for performance tools
echo "Checking performance tools:"
which perf strace iotop vmstat 2>/dev/null || \
    echo "Some tools may not be installed"

# Check system resources
echo ""
echo "System resources:"
free -h
df -h /usr/local/pgsql/data
nproc
```

[[bash -c "echo \"Checking performance tools:\" && which perf strace iotop vmstat 2>/dev/null || echo \"Some tools may not be installed\" && echo \"\" && echo \"System resources:\" && free -h && df -h /usr/local/pgsql/data 2>/dev/null && nproc"]]{{RUN}}

**Create performance baseline**:
```bash
cat > /tmp/perf_baseline.sh <<'SCRIPT'
#!/bin/bash

echo "=== Performance Baseline ==="
echo ""

# CPU info
echo "CPU Information:"
grep "model name" /proc/cpuinfo | head -1
lscpu | grep "^CPU(s):"

echo ""
echo "Memory Information:"
free -h

echo ""
echo "Disk Information:"
df -h /usr/local/pgsql/data

echo ""
echo "Network Information:"
ip addr show | grep "inet " | grep -v "127.0.0.1"

echo ""
echo "Database Connections:"
psql -h localhost -p 5432 -U postgres -c "
SELECT 
    state,
    COUNT(*) AS count
FROM pg_stat_activity
GROUP BY state;"
SCRIPT

chmod +x /tmp/perf_baseline.sh
/tmp/perf_baseline.sh
```

[[bash -c "cat > /tmp/perf_baseline.sh <<'SCRIPT'
#!/bin/bash
echo \"=== Performance Baseline ===\"
echo \"\"
echo \"CPU Information:\"
grep \"model name\" /proc/cpuinfo | head -1
lscpu | grep \"^CPU(s):\"
echo \"\"
echo \"Memory Information:\"
free -h
echo \"\"
echo \"Disk Information:\"
df -h /usr/local/pgsql/data
echo \"\"
echo \"Database Connections:\"
psql -h localhost -p 5432 -U postgres -c \"SELECT state, COUNT(*) AS count FROM pg_stat_activity GROUP BY state;\"
SCRIPT
chmod +x /tmp/perf_baseline.sh && /tmp/perf_baseline.sh"]]{{RUN}}

**What to observe**:
- Baseline metrics help track performance over time
- System resources impact database performance
- Monitoring tools identify bottlenecks

---

### Task 6: Clean Up Test Environment

**Stop second instance**:
```bash
# Stop second instance
sudo -u postgres /usr/local/pgsql/bin/pg_ctl -D /usr/local/pgsql/data2 stop

# Verify instances
ps aux | grep postgres | grep -E "5432|5433"
```

[[bash -c "sudo -u postgres /usr/local/pgsql/bin/pg_ctl -D /usr/local/pgsql/data2 stop && sleep 2 && ps aux | grep postgres | grep -E \"5432|5433\""]]{{RUN}}

**Remove second instance**:
```bash
# Remove second instance directories
sudo rm -rf /usr/local/pgsql/data2
sudo rm -rf /var/log/pgsql2

# Verify cleanup
ls -la /usr/local/pgsql/ | grep data
```

[[bash -c "sudo rm -rf /usr/local/pgsql/data2 && sudo rm -rf /var/log/pgsql2 && ls -la /usr/local/pgsql/ | grep data"]]{{RUN}}

**Clean up test files**:
```bash
# Remove test configuration files
rm -f /tmp/oltp_tuning.conf
rm -f /tmp/olap_tuning.conf
rm -f /tmp/security_hardening.conf
rm -f /tmp/secure_pg_hba.conf
rm -f /tmp/build_gaussdb.sh
rm -f /tmp/perf_baseline.sh
rm -f /tmp/server.crt /tmp/server.key

# Verify cleanup
echo "Test files cleaned up:"
ls -la /tmp/*.conf /tmp/*.sh /tmp/*.crt /tmp/*.key 2>/dev/null || echo "No test files found"
```

[[bash -c "rm -f /tmp/oltp_tuning.conf /tmp/olap_tuning.conf /tmp/security_hardening.conf /tmp/secure_pg_hba.conf /tmp/build_gaussdb.sh /tmp/perf_baseline.sh /tmp/server.crt /tmp/server.key && echo \"Test files cleaned up:\" && ls -la /tmp/*.conf /tmp/*.sh /tmp/*.crt /tmp/*.key 2>/dev/null || echo \"No test files found\""]]{{RUN}}

**What to observe**:
- Clean up prevents resource waste
- Removing test instances prevents confusion
- Proper cleanup is essential for lab environments

---

## Lab Completion Checklist

Verify you have completed all tasks:

- [ ] Task 1: Configured multi-instance setup
- [ ] Task 2: Applied advanced parameter tuning
- [ ] Task 3: Implemented security hardening
- [ ] Task 4: Customized compilation configuration
- [ ] Task 5: Set up performance profiling
- [ ] Task 6: Cleaned up test environment

## Review Questions

1. **What is benefit of multi-instance setup?**
   - [ ] Better performance
   - [ ] Isolation and resource management
   - [ ] Automatic failover
   - [ ] Data compression

2. **How does OLTP configuration differ from OLAP?**
   - [ ] OLTP has more connections, less work_mem
   - [ ] OLAP has more connections, more work_mem
   - [ ] They are identical
   - [ ] OLTP needs more disk space

3. **What is security hardening?**
   - [ ] Making database faster
   - [ ] Reducing security vulnerabilities
   - [ ] Increasing user permissions
   - [ ] Disabling all features

4. **Why compile from source?**
   - [ ] Easier installation
   - [ ] Custom optimizations and features
   - [ ] Automatic updates
   - [ ] Better documentation

## Summary

In this L3 lab, you practiced:
- **Multi-Instance**: Running multiple GaussDB instances
- **Parameter Tuning**: Workload-specific configuration
- **Security Hardening**: SSL, strong authentication, access control
- **Custom Compilation**: Source compilation with optimizations
- **Performance Profiling**: Baseline metrics and monitoring

These advanced installation techniques enable you to deploy GaussDB optimized for specific requirements and security standards.

## Next Steps

Proceed to **L4 Lab** to practice expert-level operations including:
- Complex multi-node deployments
- Advanced troubleshooting
- Production migration scenarios
- Cluster orchestration
- Performance optimization at scale
