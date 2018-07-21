# Use an official Python runtime as a parent image
FROM python:2.7-slim
FROM node:8.11.3

# Set the working directory to /app
WORKDIR /app

# Copy the current directory contents into the container at /app
ADD . /app

ENV DEBUG "mark*"
ENV NODE_PATH "./projects"
ENV ENVIRONMENT "development"
ENV PORT "3000"
ENV ETH_ENDPOINT "https://66baa351.ngrok.io"
ENV IPFS_ENDPOINT "6d228ade.ngrok.io"
ENV IPFS_PORT "80"
ENV APP_NAME "mark-ms"
ENV REDIS_HOST "redis-19632.c8.us-east-1-4.ec2.cloud.redislabs.com"
ENV REDIS_PORT "19632"
ENV REDIS_SECRET "OI10jViPOFhjZqw0q5LOiRrod7cxFpCD"
ENV MONGO_CONNECTION "mongodb://mark_application:H30soVTQ3WdNdIs91evOqt@ds014368.mlab.com:14368/mark"
ENV MS_DOCS_URL ""
ENV DOCS_URL ""
ENV AWS_ID_KEY "AKIAJ7442INMK4F7T6YQ"
ENV AWS_SECRET_KEY "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"
ENV AWS_REGION "us-east-1"
ENV ADMIN_ETH_ACC1 "0x7cff892dc9ee4fdb3f1b25f6b6ede1198c285812"
ENV ADMIN_ETH_PASS1 "0xfd464608b033612f63701c11fcf73140ef2aa196a2f7b7f374e8134e98f2f7f1"
ENV ADMIN_ETH_ACC2 "0xe6bf354295b3269059c4fd20d2ab9c648e9fae19"
ENV ADMIN_ETH_PASS2 "0x9097e997528db422bdaa5e5b3cc53ba1290f08e9fafdaf557cb74002effa9829"

# Install any needed packages specified in requirements.txt
RUN npm install --no-cache git
# RUN npm install
RUN ./node_modules/gulp/bin/gulp.js
#  RUN npm install --production



# Make port 80 available to the world outside this container
EXPOSE 3000

# Define environment variable
# ENV ENVIRONMENT production

# Run app.py when the container launches
CMD ["npm", "start"]