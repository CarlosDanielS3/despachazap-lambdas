# Use the official AWS Lambda Node.js 14 image
FROM public.ecr.aws/lambda/nodejs:22

# Copy function code
COPY index.mjs ${LAMBDA_TASK_ROOT}/index.mjs

# Install dependencies
COPY package.json ${LAMBDA_TASK_ROOT}/package.json
RUN npm install

# Set the CMD to your handler (could be index.handler)
CMD ["index.handler"]