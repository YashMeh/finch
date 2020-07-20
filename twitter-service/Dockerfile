#Using an alpine version of node
FROM node:8.7.0-alpine

#Create app directory and use it as the working directory
RUN mkdir -p /twitter
WORKDIR /twitter

#Copying the package files from localstorage to image
COPY package.json /twitter
COPY package-lock.json /twitter

#Installing dependencies
RUN npm install

#Copying all the files from localstorage to image
COPY . /twitter

#Starting the server using nodemon
CMD ["npm","run","start"]
