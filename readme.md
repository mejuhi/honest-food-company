## CICD Working:
### Developer Pushes Code to Cloud Source Repository
![source repos](https://github.com/mejuhi/honest-food-company/blob/master/images/Untitled.png)

### This will trigger Cloud Build Pipeline for Continuous integration which have been set to run on git push
![tiggers](https://github.com/mejuhi/honest-food-company/blob/master/images/3_pushtobranchtrigger.png)

### You can check the build status to check your deployment
![build](https://github.com/mejuhi/honest-food-company/blob/master/images/buildstatus.png)


### Here we install npm, build container image, push to container registry.


## Steps for creating  CICD Infrastructure
#### 1. Enable services
```
gcloud services enable container.googleapis.com \
cloudbuild.googleapis.com \
sourcerepo.googleapis.com \
containeranalysis.googleapis.com
```

#### 2. Create GKE
```
gcloud container clusters create demo-cloudbuild --num-nodes 1 --zone asia-southeast1
```

#### 3. Create repo
```
gcloud source repos create demo-app
```

#### 3.  clone the repo
```
cd ~
git clone https://github.com/mejuhi/honest-food-company.git \
demo-app
```

#### 4. Create remote
```
cd ~/demo-app
PROJECT_ID=$(gcloud config get-value project)
git remote add google https://source.developers.google.com/p/${PROJECT_ID}/r/demo-app
```

#### 5. Submit cloudbuild job 
```
cd ~/demo-app
COMMIT_ID="$(git rev-parse --short=7 HEAD)"
gcloud builds submit --tag="gcr.io/${PROJECT_ID}/demo-cicd:${COMMIT_ID}" .
```

#### 6.  push the code
```
git push google master
```

#### 7. Create roles
```
PROJECT_ID=$(gcloud config get-value project)

PROJECT_NUMBER="$(gcloud projects describe ${PROJECT_ID} --format='get(projectNumber)')"
gcloud projects add-iam-policy-binding ${PROJECT_NUMBER} \
   --member=serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com \
   --role=roles/container.developer
```

#### 8. If any changes to be made then use following cmd
```
git commit -a -m "removed test"
git push google master
```

#### 9. change username creds
```
git config --global user.email "juhigupta996@gmail.com"
git config --global user.name "juhi"
```

#### 10. Another repo for development
```
gcloud source repos create demo-env
```

#### 11. clone the repo for nother env
```
cd ~
gcloud source repos clone demo-env
cd ~/demo-env
git checkout -b production
```

#### 12. Copy file, for diff env 
```
cd ~/demo-env
cp ~/demo-app/cloudbuild-delivery.yml ~/demo-env/cloudbuild.yml
git add .
git commit -m "Create cloudbuild.yml for deployment"
````
#### 13. checkout and push
```
git checkout -b candidate
git push origin production
git push origin candidate
```

#### 14. Push the changes
```
cd ~/demo-app
git add .
git commit -m "Trigger CD pipeline"
git push google master
```


## Steps for creating it using manual configuration

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

### Step 5: Setup Ambassador
```
kubectl apply -f https://www.getambassador.io/yaml/aes-crds.yaml && \
kubectl wait --for condition=established --timeout=90s crd -lproduct=aes && \
kubectl apply -f https://www.getambassador.io/yaml/aes.yaml && \
kubectl -n ambassador wait --for condition=available --timeout=90s deploy -lproduct=aes

# Note down the public  ip address to connect to ambassador
kubectl get -n ambassador service ambassador -o "go-template={{range .status.loadBalancer.ingress}}{{or .ip .hostname}}{{end}}"
```

```
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -subj '/CN=ambassador-cert' -nodes
kubectl create secret tls tls-cert --cert=cert.pem --key=key.pem
cat <<EOF >> wildcard-host.yaml
---
apiVersion: getambassador.io/v2
kind: Host
metadata:
  name: wildcard-host
spec:
  hostname: "*"
  acmeProvider:
    authority: none
  tlsSecret:
    name: tls-cert
  selector:
    matchLabels:
      hostname: wildcard-host
EOF
kubectl apply -f wildcard-host.yaml
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
---
apiVersion: getambassador.io/v2
kind: Mapping
metadata:
  name: hello-backend
  namespace: ambassador
spec:
  prefix: /hello/
  service: helloworld-service
EOF

kubectl apply -f hello-app.yaml -n ambassador
```

Step 5: Check the node js service
```
https://<ambassador-publicIp>/hello/
#Example
https://146.148.44.155/hello/
```











