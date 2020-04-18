## 1. Create a Kubernetes cluster which runs a node.js service. You can use any “hello world” node.js service.

### Step 1: Creating docker image for the hello-world node js app:

#### Step 1.1: Place required files into a directory:
```
#Create a directory
mkdir hello-world
cd hello-world/

cat <<EOF >>package.json
{
  "name": "docker_web_app",
  "version": "1.0.0",
  "description": "Node.js on Docker",
  "author": "First Last <first.last@example.com>",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.16.1"
  }
}
EOF

cat <<EOF >>server.js
'use strict';
const express = require('express');
// Constants
const PORT = 8080;
const HOST = '0.0.0.0';
const app = express();
app.get('/', (req, res) => {
  res.send('Hello World');
});
app.listen(PORT, HOST);
console.log(‘Running’);
EOF

cat <<EOF >> Dockerfile
FROM node:10
# Create app directory
WORKDIR /usr/src/app
# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
RUN npm install
# If you are building your code for production
# RUN npm ci --only=production
# Bundle app source
COPY . .
EXPOSE 8080
CMD [ "node", "server.js" ]
EOF

cat <<EOF >> .dockerignore
node_modules
npm-debug.log
EOF
```
### Step 2. Check If files are placed propely and run npm command 
```
ls -latr
npm install
ls -latr
```
### Step 3. Using Docker build create the docker files
```
docker build -t juhigupta/node-web-app .
```

#### Step 4: Push the Docker image into the dockerhub
```
# Enter the password when asked
docker login --username=mejuhigupta

#Note down the imageid of docker image juhigupta/node-web-app
docker images

#Replace docker image id '9d3b53b81552' with yours
docker tag 9d3b53b81552 mejuhigupta/hello-world-node:v1

#Check new docker image
docker images

#Push the docker image into dockerhub
docker push mejuhigupta/hello-world-node
```

#### Optional: Check docker image by running it locally
```
docker run -p 8081:8080 -d mejuhigupta/hello-world-node:v1
```

### Step 2: Create kubernetes cluster using following command on google shell
```
gcloud beta container --project "honestfoodcompany-274609" clusters create "honestfoodcompanyassignement" --zone "us-central1-c" --no-enable-basic-auth --cluster-version "1.14.10-gke.27" --machine-type "n1-standard-1" --image-type "COS" --disk-type "pd-standard" --disk-size "100" --metadata disable-legacy-endpoints=true --scopes "https://www.googleapis.com/auth/devstorage.read_only","https://www.googleapis.com/auth/logging.write","https://www.googleapis.com/auth/monitoring","https://www.googleapis.com/auth/servicecontrol","https://www.googleapis.com/auth/service.management.readonly","https://www.googleapis.com/auth/trace.append" --num-nodes "3" --enable-stackdriver-kubernetes --enable-ip-alias --network "projects/honestfoodcompany-274609/global/networks/default" --subnetwork "projects/honestfoodcompany-274609/regions/us-central1/subnetworks/default" --default-max-pods-per-node "110" --no-enable-master-authorized-networks --addons HorizontalPodAutoscaling,HttpLoadBalancing --enable-autoupgrade --enable-autorepair
```

### Step 3: Connect to the kubernetes cluster just created using cloud shell
```
gcloud container clusters get-credentials honestfoodcompanyassignement --zone us-central1-c --project honestfoodcompany-274609
```

### Step 4: Create deployment and service for hello world app on GKE
```
cd .. 
mkdir files
cd files/
cat <<EOF >> hello-app.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: helloworld-deployment
  labels:
    app: helloworld
spec:
  replicas: 1
  selector:
    matchLabels:
      app: helloworld
  template:
    metadata:
      labels:
        app: helloworld
    spec:
      containers:
      - name: helloworld-nodejs
        image: mejuhigupta/hello-world-node:v1
        ports:
        - containerPort: 8080
        resources:
          requests:
            cpu: 100m
            memory: 64Mi
          limits:
            cpu: 200m
            memory: 128Mi
---
apiVersion: v1
kind: Service
metadata:
  name: helloworld-service
  labels:
    app: helloworld
spec:
  type: LoadBalancer
  selector:
    app: helloworld
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8080
EOF


kubectl apply -f hello-app.yaml -n honestfoodcompany
```

## 2 With your results from 1.: either implement (in Kubernetes) or describe:
## 2.a. How do you make the service scalable?
```

```
