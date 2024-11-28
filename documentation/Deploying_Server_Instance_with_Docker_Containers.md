---
title: Deploying Server Instances with Docker Containers
category: Server Deployment
---
# Deploying Server Instances with Docker Containers

This guide will walk you through deploying API-X server instances using Docker containers, assuming NGINX is used as a reverse proxy to manage the traffic to the containers. We recommend reading the manual deployment guide first, as it will provide an understanding of the basic deployment process.

## Prerequisites

Before deploying an API-X server with Docker, ensure you have:

- Docker and Docker Compose installed on your server.
- An existing NGINX configuration to serve as the reverse proxy (refer to the [manual deployment guide](./Deploying_API_X_Servers.md)).
- Basic knowledge of Docker and how to use Docker Compose.

## Step 1: Create a Dockerfile

A Dockerfile is required to containerize your API-X server. Create a file named `Dockerfile` in your project directory with the following contents:

```dockerfile
# Use an official Node.js runtime as a base image
FROM node:18

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose the port defined in your apix.config.json
EXPOSE 3000

# Start the API-X server
CMD [ "npm", "start" ]
```

Make sure the port specified in the `EXPOSE` command matches the port configured in your `apix.config.json` file. In addition, make sure the `host` is set to `0.0.0.0`. A typical configuration file for a docker deployment would look like this:

```json
{
  "host": "0.0.0.0",
  "port": 3000,
  "maxRequestAge": 60000
}
```

## Step 2: Create a Docker Compose File

To make managing multiple instances easier, create a `docker-compose.yml` file. This file will define how to run multiple containers of your API-X server.

```yaml
version: '3.8'

services:
  apix:
    build: .
    ports:
      - "3000-3002:3000"
    environment:
      NODE_ENV: production
    restart: always
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      resources:
        limits:
          cpus: "0.5"
          memory: "512M"
```

In this `docker-compose.yml` file:

- We define a service called `apix`.
- The `build` option points to the current directory, where the Dockerfile is located.
- We expose port `3000` and set it to be mapped to the host's port `3000`.
- The `deploy` section allows you to define replicas, resource limits, and update configurations for scaling.

## Step 3: Build and Run the Docker Containers

To build and run your API-X server using Docker Compose, run the following commands:

```sh
docker-compose build
docker-compose up -d
```

- `docker-compose build` will build the Docker image using the Dockerfile.
- `docker-compose up -d` will start the containers in detached mode.

## Step 4: Configure NGINX as a Reverse Proxy

Since we are deploying API-X behind a reverse proxy, update your NGINX configuration to direct traffic to the Docker containers. Edit your NGINX configuration file (e.g., `/etc/nginx/sites-available/default`) as follows:

```nginx
upstream apix_backend {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
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

This configuration defines an `upstream` block named `apix_backend` that contains the three replicas of your API-X server.

- Each instance is running on a different port (`3000`, `3001`, `3002`) on `127.0.0.1`.
- The server block directs incoming traffic to the appropriate backend server, allowing load balancing.

## Step 5: Enable HTTPS

To secure your deployment, enable HTTPS for NGINX:

1. **Install Certbot**:

   ```sh
   sudo apt install certbot python3-certbot-nginx
   ```

2. **Obtain an SSL Certificate**:

   ```sh
   sudo certbot --nginx -d yourdomain.com
   ```

   Follow the prompts to get an SSL certificate for your domain.

3. **Reload NGINX**:

   ```sh
   sudo systemctl reload nginx
   ```

This ensures that all traffic between your users and the NGINX load balancer is encrypted.

## Step 6: Deploy for Scalability

In this guide, you deployed multiple instances on the *same host*. This helps with resource management and distribution. However, as your traffic increases, you may need to balance the load between *multiple hosts*.

There are several options to achieve this, including:

- **Docker Swarm**: Docker Swarm is a container orchestration tool that allows you to deploy services across multiple hosts, providing built-in load balancing and scaling. It simplifies managing container clusters.
- **Kubernetes**: Kubernetes is a popular open-source container orchestration system that provides automated deployment, scaling, and management of containerized applications. It offers advanced features like auto-healing, secret management, and rolling updates.
- **Cloud Load Balancers**: Cloud providers such as AWS, GCP, and Azure offer managed load balancers that can route traffic to instances across multiple hosts, regions, or even availability zones, ensuring high availability and low latency.

For more information on setting up load balancing between multiple hosts, please refer to [*Load Balancing Between Multiple Hosts*](./Load_Balancing_Between_Multiple_Hosts.md).

## Conclusion

Deploying API-X server instances using Docker containers provides an efficient and consistent way to manage deployments. Combined with NGINX as a reverse proxy, you can easily secure and scale your deployment to handle increased traffic. This setup ensures that each instance runs in isolation, making the deployment more resilient and scalable.
