---
title: Securing API-X Server Hosts
category: Server Deployment
---
# Securing API-X Server Hosts

When deploying API-X servers, especially manually or outside of cloud platforms, it's essential to secure your infrastructure against various attacks, including Distributed Denial of Service (DDoS) attacks, unauthorized access, and other threats. Cloud platforms like AWS, GCP, and Azure offer built-in security mechanisms, but when managing your own servers, particularly on CentOS or Ubuntu, you need to implement these security measures yourself. This guide will help you secure API-X servers effectively.

## 1. Harden Network Security

### 1.1. Firewall Configuration

Firewalls are your first line of defense in network security. On both CentOS and Ubuntu, firewalls can be managed using `firewalld` or `ufw` respectively:

- **CentOS** (using `firewalld`):
  - Install `firewalld` if it's not already installed:
    ```sh
    sudo yum install firewalld
    sudo systemctl enable firewalld
    sudo systemctl start firewalld
    ```
  - Allow only essential services (e.g., HTTP, HTTPS, SSH):
    ```sh
    sudo firewall-cmd --permanent --add-service=http
    sudo firewall-cmd --permanent --add-service=https
    sudo firewall-cmd --permanent --add-service=ssh
    sudo firewall-cmd --reload
    ```

- **Ubuntu** (using `ufw`):
  - Enable `ufw` and allow essential services:
    ```sh
    sudo apt install ufw
    sudo ufw allow http
    sudo ufw allow https
    sudo ufw allow ssh
    sudo ufw enable
    ```

### 1.2. DDoS Protection

- **Rate Limiting**: Configure rate limiting for connections to mitigate DDoS attacks.
  - Use `iptables` or `nftables` on CentOS and Ubuntu to limit the number of connections:
    ```sh
    sudo iptables -A INPUT -p tcp --dport 80 -m connlimit --connlimit-above 20 -j DROP
    ```
- **Use Fail2ban**: Install Fail2ban to protect against brute force attacks.
  - **CentOS**:
    ```sh
    sudo yum install epel-release
    sudo yum install fail2ban
    sudo systemctl enable fail2ban
    sudo systemctl start fail2ban
    ```
  - **Ubuntu**:
    ```sh
    sudo apt install fail2ban
    sudo systemctl enable fail2ban
    sudo systemctl start fail2ban
    ```

### 1.3. Set Up VPN for Administrative Access

For additional security, consider restricting SSH access to a Virtual Private Network (VPN). This helps ensure that only trusted users on the VPN can access your servers remotely.

## 2. Harden SSH Access

### 2.1. Disable Root Login

Disable direct root login to prevent attackers from attempting to guess the root password:

- Edit `/etc/ssh/sshd_config` and set the following:
  ```conf
  PermitRootLogin no
  ```
- Restart the SSH service:
  ```sh
  sudo systemctl restart sshd
  ```

### 2.2. Use SSH Key Authentication

Replace password-based authentication with SSH key authentication for enhanced security:

1. **Generate an SSH Key Pair** (on your local machine):
   ```sh
   ssh-keygen -t rsa -b 4096
   ```
2. **Copy the Public Key to the Server**:
   ```sh
   ssh-copy-id user@server_ip
   ```
3. **Disable Password Authentication**:
   - Edit `/etc/ssh/sshd_config` and set:
     ```conf
     PasswordAuthentication no
     ```
   - Restart the SSH service:
     ```sh
     sudo systemctl restart sshd
     ```

## 3. Secure HTTP/HTTPS Traffic

### 3.1. Use SSL/TLS Certificates

To secure traffic between clients and your API-X server, use SSL/TLS certificates:

1. **Generate SSL Certificates**: Use Let's Encrypt to generate free SSL certificates.
   ```sh
   sudo apt install certbot
   sudo certbot certonly --standalone -d yourdomain.com
   ```
2. **Auto-Renew Certificates**: Set up a cron job to automatically renew your certificates:
   ```sh
   0 3 * * * /usr/bin/certbot renew --quiet
   ```

### 3.2. Configure NGINX/Apache for HTTPS

- **NGINX**: Edit your NGINX configuration to use SSL:
  ```nginx
  server {
      listen 443 ssl;
      server_name yourdomain.com;

      ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
      ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

      location / {
          proxy_pass http://localhost:3000;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
      }
  }
  ```

- **Apache**: Enable SSL module and configure Apache to use SSL:
  ```sh
  sudo a2enmod ssl
  sudo systemctl restart apache2
  ```
  Edit your Apache site configuration to use SSL:
  ```apache
  <VirtualHost *:443>
      ServerName yourdomain.com

      SSLEngine on
      SSLCertificateFile /etc/letsencrypt/live/yourdomain.com/fullchain.pem
      SSLCertificateKeyFile /etc/letsencrypt/live/yourdomain.com/privkey.pem

      ProxyPass / http://localhost:3000/
      ProxyPassReverse / http://localhost:3000/
  </VirtualHost>
  ```

## 4. Monitor and Update Regularly

### 4.1. System Updates

Keep your server software up-to-date to protect against known vulnerabilities:

- **CentOS**:
  ```sh
  sudo yum update -y
  ```
- **Ubuntu**:
  ```sh
  sudo apt update && sudo apt upgrade -y
  ```

### 4.2. Intrusion Detection

Use tools like **AIDE** (Advanced Intrusion Detection Environment) to monitor changes to your system:

- **CentOS**:
  ```sh
  sudo yum install aide
  sudo aide --init
  ```
- **Ubuntu**:
  ```sh
  sudo apt install aide
  sudo aide --init
  ```

### 4.3. Log Monitoring

Use tools like **Logwatch** or set up **rsyslog** to monitor and analyze logs for unusual activity:

- **Install Logwatch**:
  - **CentOS**:
    ```sh
    sudo yum install logwatch
    ```
  - **Ubuntu**:
    ```sh
    sudo apt install logwatch
    ```

## Conclusion

Securing API-X servers involves multiple layers of protection, from network security and SSH hardening to SSL encryption and log monitoring. By following these steps, you can create a robust security posture for your API-X deployment, whether you're using CentOS or Ubuntu. Regular updates, monitoring, and limiting access to your servers are crucial practices to defend against potential threats and ensure the reliability of your application.

