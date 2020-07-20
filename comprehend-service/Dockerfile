#Using an alpine version of node
FROM node:8.7.0-alpine

#Create app directory and use it as the working directory
RUN mkdir -p /comprehend
WORKDIR /comprehend

#Copying the package files from localstorage to image
COPY package.json /comprehend
COPY package-lock.json /comprehend

#Installing dependencies
RUN npm install

#Copying all the files from localstorage to image
COPY . /comprehend

#Starting the server using nodemon
CMD ["npm","run","start"]
