# Use Playwright's official Node image so Chromium and its Linux dependencies
# are available at runtime for the crawl API.
FROM mcr.microsoft.com/playwright:v1.60.0-noble

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of your application code
COPY . .

# Build the application
RUN npm run build

# Expose the port your app runs on (Railway sets this via the PORT env variable)
EXPOSE 3000

# Command to run the application
CMD ["npm", "run", "start"]
