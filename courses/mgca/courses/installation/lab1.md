# Installation Module - L1 Lab: Basic GaussDB Installation

## Lab Overview

In this L1 (Entry Level) lab, you will practice basic GaussDB installation and configuration tasks, including:
- Checking system prerequisites
- Configuring kernel parameters
- Verifying resource limits
- Performing basic post-installation checks

**Time Required**: 20 minutes
**Prerequisites**: Root/sudo access to Linux system

## Learning Objectives

By completing this lab, you will be able to:
- Verify system meets GaussDB installation requirements
- Configure essential kernel parameters
- Check resource limits for database user
- Validate successful GaussDB installation

## Lab Tasks

### Task 1: Check System Prerequisites

Let's verify the system meets minimum requirements for GaussDB installation.

**Command to run**:
```bash
cat /etc/os-release
```

[[cat /etc/os-release]]{{RUN}}

**What to observe**:
- OS distribution and version (CentOS 7.x, openEuler, SUSE, etc.)
- Supported OS versions: CentOS 7.6+, openEuler 20.03+, SUSE 12 SP3+

**Check system architecture**:
```bash
uname -m
```

[[uname -m]]{{RUN}}

**Expected output**: x86_64 or aarch64 (supported architectures)

**Verify available memory**:
```bash
free -h
```

[[free -h]]{{RUN}}

**Minimum requirements**:
- RAM: 2GB minimum, 4GB+ recommended
- Swap: At least equal to RAM size

---

### Task 2: Configure Kernel Parameters

GaussDB requires specific kernel parameters for optimal performance. Let's configure them.

**Check current kernel parameters**:
```bash
sysctl -a | grep -E 'kernel.sem|kernel.shm|vm.swappiness|fs.aio'
```

[[sysctl -a | grep -E 'kernel.sem|kernel.shm|vm.swappiness|fs.aio']]{{RUN}}

**What to observe**:
- kernel.sem: Semaphore settings
- kernel.shmmax, kernel.shmall: Shared memory limits
- vm.swappiness: Swap tendency (0-100)
- fs.aio-max-nr: Async I/O max requests

**Configure recommended kernel parameters**:
```bash
cat >> /etc/sysctl.conf << 'EOF'
# GaussDB Kernel Parameters
kernel.sem = 250 32000 100 128
kernel.shmall = 4294967296
kernel.shmmax = 68719476736
vm.swappiness = 10
fs.aio-max-nr = 1048576
EOF
```

[[cat >> /etc/sysctl.conf << 'EOF'
# GaussDB Kernel Parameters
kernel.sem = 250 32000 100 128
kernel.shmall = 4294967296
kernel.shmmax = 68719476736
vm.swappiness = 10
fs.aio-max-nr = 1048576
EOF]]{{RUN}}

**Apply kernel parameters**:
```bash
sysctl -p
```

[[sysctl -p]]{{RUN}}

**Verification**:
```bash
sysctl kernel.sem kernel.shmmax vm.swappiness fs.aio-max-nr
```

[[sysctl kernel.sem kernel.shmmax vm.swappiness fs.aio-max-nr]]{{RUN}}

---

### Task 3: Check and Configure Resource Limits

Database user needs appropriate resource limits to operate efficiently.

**Check current resource limits for omm user** (default GaussDB user):
```bash
su - omm -c "ulimit -a"
```

[[su - omm -c "ulimit -a"]]{{RUN}}

**Key limits to check**:
- **max user processes** (-u): Should be 100000+ for production
- **open files** (-n): Should be 100000+ for production
- **max memory size** (-m): Should be unlimited
- **virtual memory** (-v): Should be unlimited

**Configure resource limits in /etc/security/limits.conf**:
```bash
cat >> /etc/security/limits.conf << 'EOF'
# GaussDB Resource Limits
omm soft nofile 100000
omm hard nofile 100000
omm soft nproc 100000
omm hard nproc 100000
omm soft memlock unlimited
omm hard memlock unlimited
EOF
```

[[cat >> /etc/security/limits.conf << 'EOF'
# GaussDB Resource Limits
omm soft nofile 100000
omm hard nofile 100000
omm soft nproc 100000
omm hard nproc 100000
omm soft memlock unlimited
omm hard memlock unlimited
EOF]]{{RUN}}

**Verification**:
```bash
grep omm /etc/security/limits.conf
```

[[grep omm /etc/security/limits.conf]]{{RUN}}

---

### Task 4: Verify GaussDB Installation

Check if GaussDB is installed and running.

**Check GaussDB installation directory**:
```bash
ls -la /opt/huawei/install/app/
```

[[ls -la /opt/huawei/install/app/]]{{RUN}}

**What to observe**:
- bin/ directory: Contains executables (gs_ctl, gsql, gs_dump, etc.)
- data/ directory: Contains database data files
- cfg/ directory: Configuration files

**Check GaussDB version**:
```bash
gsql --version
```

[[gsql --version]]{{RUN}}

**Check database process status**:
```bash
su - omm -c "gs_ctl status -D /opt/huawei/install/data/db1"
```

[[su - omm -c "gs_ctl status -D /opt/huawei/install/data/db1"]]{{RUN}}

**Expected output**: Server status should show "running" or similar active status

**Verify database is accessible**:
```bash
gsql -d postgres -p 5432 -c "SELECT version();"
```

[[gsql -d postgres -p 5432 -c "SELECT version();"]]{{RUN}}

**Expected output**: Should return GaussDB version information

---

### Task 5: Check Network Configuration

Verify network settings for database connectivity.

**Check listening port**:
```bash
netstat -tlnp | grep 5432
```

[[netstat -tlnp | grep 5432]]{{RUN}}

**What to observe**:
- Port 5432 should be listening
- Address 0.0.0.0 (all interfaces) or specific IP
- Process ID and name (gaussdb)

**Check postgresql.conf for listen_addresses**:
```bash
grep "listen_addresses" /opt/huawei/install/data/db1/postgresql.conf
```

[[grep "listen_addresses" /opt/huawei/install/data/db1/postgresql.conf]]{{RUN}}

**Expected**: listen_addresses = '*' (allows all connections) or specific IP

**Check firewall rules**:
```bash
firewall-cmd --list-all 2>/dev/null || iptables -L -n
```

[[firewall-cmd --list-all 2>/dev/null || iptables -L -n]]{{RUN}}

**What to verify**:
- Port 5432 should be allowed through firewall
- If blocked, add rule: `firewall-cmd --add-port=5432/tcp --permanent`

---

## Lab Completion Checklist

Verify you have completed all tasks:

- [ ] Task 1: Checked system prerequisites (OS, architecture, memory)
- [ ] Task 2: Configured kernel parameters
- [ ] Task 3: Verified and configured resource limits
- [ ] Task 4: Verified GaussDB installation and running status
- [ ] Task 5: Checked network configuration and port accessibility

## Review Questions

1. **What is the minimum RAM requirement for GaussDB installation?**
   - [ ] 512 MB
   - [ ] 1 GB
   - [ ] 2 GB
   - [ ] 4 GB

2. **Which kernel parameter controls the maximum size of a shared memory segment?**
   - [ ] kernel.sem
   - [ ] kernel.shmmax
   - [ ] vm.swappiness
   - [ ] fs.aio-max-nr

3. **What is the recommended value for open files limit (-n) in production?**
   - [ ] 1024
   - [ ] 4096
   - [ ] 100000
   - [ ] Unlimited

4. **Which command shows the GaussDB server status?**
   - [ ] gsql --version
   - [ ] gs_ctl status
   - [ ] gs_ctl start
   - [ ] gs_ctl restart

## Summary

In this L1 lab, you practiced:
- **System Verification**: Checked OS, architecture, and memory requirements
- **Kernel Configuration**: Configured semaphore, shared memory, and swap parameters
- **Resource Limits**: Set appropriate limits for file descriptors and processes
- **Installation Verification**: Confirmed GaussDB is installed and running
- **Network Configuration**: Verified port listening and firewall settings

These basic installation and configuration tasks are essential for deploying a functional GaussDB instance.

## Next Steps

Proceed to **L2 Lab** to practice intermediate installation tasks including:
- Installing GaussDB in primary-standby mode
- Configuring network and replication settings
- Performing post-installation tuning
- Managing database users and permissions
