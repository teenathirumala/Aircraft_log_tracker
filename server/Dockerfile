# Use an official Node.js runtime as a parent image.
# Using alpine for a smaller image size.
FROM node:18-alpine

# Set the working directory in the container to /app
WORKDIR /app/server

# Copy package.json and package-lock.json to the working directory
# This leverages Docker's layer caching.
COPY package*.json ./

# Install any needed packages
RUN npm install

# Copy the rest of the server's source code
COPY . .

# Make port 5001 available to the world outside this container
EXPOSE 5001

# Define the command to run your app
CMD ["node", "src/app.js"] 