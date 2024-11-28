---
title: Deploying API-X Servers
category: Server Deployment
---
# Deploying API-X Servers

This guide provides developers with multiple ways to deploy an API-X server. There are several options for deploying Node.js applications, including using cloud platforms like Heroku, Google Cloud Platform (GCP), and Amazon Web Services (AWS), or containerized solutions like Docker. Each of these options has its pros and cons:

- **Cloud Platforms (e.g., Azure, GCP, AWS)**: These platforms provide easy deployment, scalability, and built-in security features, making them ideal for developers looking for a managed and streamlined deployment process. They also offer integrated monitoring, load balancing, and redundancy, which makes scaling applications easier. However, these platforms may come at a higher cost, especially as your usage scales. If you opt not to use a cloud platform, make sure you read [*Securing API-X Server Hosts*](./Securing_API_X_Server_Hosts.md).
- **Docker Containers**: Docker offers consistency and portability, allowing you to deploy your application in the same way across different environments. It simplifies scaling and ensures that your app works the same everywhere. Docker is especially useful when deploying across multiple hosts, as it provides a unified deployment method. However, it requires more setup and knowledge of container management tools. If you are interested in using Docker to simplify deployment across multiple hosts, please refer to [*Deploying Server Instances with Docker Containers*](./Deploying_Server_Instance_with_Docker_Containers.md) *after* reading this guide.

In this guide, we will focus on manual deployment, which includes deploying directly or using a reverse proxy. API-X is based on Express, making deployment flexible and straightforward. We will cover different methods for deploying API-X servers, including direct deployment and deployment using proxies like NGINX or Apache. Additionally, we will cover how to secure your endpoints with HTTPS and how load balancers can be used to manage traffic load.

## Prerequisites

Before deploying an API-X server, ensure you have:

- Node.js installed on your server (version 18 or higher).
- The API-X project ready to deploy.
- A server environment to deploy the application (e.g., Ubuntu, CentOS, or a cloud-based VPS).

## Configuring API-X Host and Port

API-X allows developers to specify the host and port through a configuration file. You can create a file called `apix.config.json` in your project directory and define the host and port as follows:

```json
{
  "host": "127.0.0.1",
  "port": 3000,
  "maxRequestAge": 60000
}
```

Ensure this file is included in your deployment and properly configured for the environment you are deploying to.

If you want your server to be directly accessible from a different machine (only required for direct deployments), you can set the `host` to `0.0.0.0`.

## Deploying Behind a Reverse Proxy (Recommended)

Deploying API-X behind a reverse proxy like NGINX or Apache offers additional security and load balancing capabilities. Below, we discuss how to set up both options.

### Deploying with NGINX

NGINX is a popular choice for a reverse proxy to handle requests to your API-X server and to add HTTPS.

1. **Install NGINX**: Run the following command to install NGINX on your server:

   ```sh
   sudo apt update
   sudo apt install nginx
   ```

2. **Create an NGINX Configuration File**: Edit the NGINX configuration to create a reverse proxy for your API-X server. The configuration file should be located at `/etc/nginx/sites-available/default` or you can create a new one for your API.

   Example configuration:

   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Replace `yourdomain.com` with your domain or IP address, and ensure that the port matches the one specified in `apix.config.json`.

3. **Enable HTTPS**: To secure your API-X server, you need to enable HTTPS. The easiest way to do this is by using Let's Encrypt:

   ```sh
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

   Follow the prompts to get an SSL certificate for your domain.

4. **Reload NGINX**: After updating the configuration, reload NGINX:

   ```sh
   sudo systemctl reload nginx
   ```

### Deploying with Apache

Apache can also be used as a reverse proxy.

1. **Install Apache**: Run the following command to install Apache on your server:

   ```sh
   sudo apt update
   sudo apt install apache2
   ```

2. **Enable Proxy Modules**: You need to enable the necessary proxy modules for Apache to work as a reverse proxy:

   ```sh
   sudo a2enmod proxy
   sudo a2enmod proxy_http
   ```

3. **Create an Apache Configuration File**: Edit the Apache configuration file (e.g., `/etc/apache2/sites-available/000-default.conf`) to add a reverse proxy for your API-X server:

   ```apache
   <VirtualHost *:80>
       ServerName yourdomain.com

       ProxyPreserveHost On
       ProxyPass / http://localhost:3000/
       ProxyPassReverse / http://localhost:3000/
   </VirtualHost>
   ```

4. **Enable HTTPS**: Install Certbot and enable HTTPS for your domain:

   ```sh
   sudo apt install certbot python3-certbot-apache
   sudo certbot --apache -d yourdomain.com
   ```

   Follow the prompts to complete the SSL setup.

5. **Restart Apache**: Restart Apache to apply the changes:

   ```sh
   sudo systemctl restart apache2
   ```

## Direct Deployment

Direct deployment involves running the API-X server directly using Node.js. This method is simple but might lack additional security and load balancing features compared to using a reverse proxy. Direct deployment exposes the server directly to the internet, making it more vulnerable to attacks and requiring the developer to handle SSL/TLS configuration within the Node.js environment.

While this method is possible and preferred during development, it's recommended to use a simple NGINX or Apache configuration to spin-up your host.

## Securing Your Endpoints with HTTPS

To ensure that your API-X endpoints are secure, it is crucial to use HTTPS. Here are some steps you can take:

1. **Use Let's Encrypt**: Free SSL certificates from Let's Encrypt can be used to easily secure your API-X server.

2. **Redirect HTTP to HTTPS**: Ensure all incoming HTTP requests are redirected to HTTPS. In NGINX, add the following server block:

   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       return 301 https://$host$request_uri;
   }
   ```

   This will ensure that all traffic is encrypted.

3. **Use Strong TLS Configuration**: Ensure you have a strong TLS configuration. You can refer to Mozilla's SSL Configuration Generator for the latest secure settings.

4. **Disable Insecure Protocols**: Make sure to disable protocols like SSLv3 and weak ciphers in your server configuration.

## Load Balancing with NGINX

If you anticipate high traffic, you can set up load balancing with NGINX to distribute requests across multiple API-X server instances, which can be running on different servers, ensuring better performance and reliability. When using load balancing, it's important to secure both the connection between the load balancer and clients as well as between the load balancer and backend servers.

- **Client to Load Balancer Encryption**: Ensure all communication between the clients and the load balancer is encrypted using SSL/TLS. This is usually done by setting up HTTPS on the load balancer using tools like Let's Encrypt.
- **Load Balancer to Backend Server Encryption**: If your backend servers are on an independent network, consider encrypting the traffic between the load balancer and the backend servers. This can be done using HTTPS between NGINX and the API-X instances.
  - If your backend servers are on the same internal, private network, encryption between the load balancer and backend servers may not be necessary. However, it's still a good practice if you want an extra layer of security.

### Basic Load Balancing Configuration with NGINX

To set up load balancing with NGINX, follow these steps:

1. **Update the NGINX Configuration**: Edit your NGINX configuration to include multiple backend servers, potentially running on different hosts. This configuration will distribute incoming requests evenly between the servers, and you can choose whether to encrypt traffic between the load balancer and the backend.

   Even if the instances are running on the same host (using different ports), using NGINX as a load balancer can provide benefits such as better resource utilization and failover within the same machine.
   ```nginx
   upstream apix_backend {
       server 192.168.1.10:3000;
       server 192.168.1.11:3000;
       server 192.168.1.12:3000;
   }

   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://apix_backend;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   In this example, NGINX will distribute requests across three API-X server instances running on different hosts (`192.168.1.10`, `192.168.1.11`, and `192.168.1.12`). Replace `yourdomain.com` with your domain name. To add encryption, consider changing `http` to `https` in `proxy_pass` and configuring SSL on your backend servers as well.
2. **Reload NGINX**: After updating the configuration, reload NGINX to apply the changes:
   ```sh
   sudo systemctl reload nginx
   ```
3. **Scaling Up**: You can add more server instances to the `upstream` block as needed to handle increased load.

## Conclusion

Deploying an API-X server can be done directly or through a reverse proxy like NGINX or Apache. While direct deployment is quick and simple, using a reverse proxy provides better scalability and security. Always ensure that your API-X endpoints are secure by using HTTPS, redirecting HTTP traffic, and maintaining a strong TLS configuration.

With this guide, you should be able to deploy your API-X server securely and efficiently. Choose the deployment method that best fits your needs and the scale of your application.
