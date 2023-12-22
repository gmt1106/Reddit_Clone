# Use an existing image as a base
FROM node:14

# Create app directory
WORKDIR /usr/src/app

# Copy the package.json and yarn.lock files where the dependencies are spcifed. 
# we are separating these two lines with COPY . . which copies all code, because there is cache. 
# Docker check package.json and yarn.lock files, and see if there is any changes. If there isn't any then use the cahced version. 
# so if we replace these two lines with COPY . . then even for any small code change, docker will reinstall all dependencies. 
COPY package.json ./
COPY yarn.lock ./

# Install the dependencies
RUN yarn

# Copy the rest of the code
# Bundle app source
COPY . .

# rename .env.production file to .env file in the prod
COPY .env.production .env

# Generate dist files
RUN yarn build

# Set the environment to prod
ENV NODE_ENV production

# Expose the port that the app listens on
EXPOSE 8080

# Define the command to run the app
CMD ["node", "dist/index.js"]
USER node