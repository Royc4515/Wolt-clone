# use an official Python runtime as a parent image
FROM python:3.9-slim

# define the working directory in the container
WORKDIR /app

# copy the client script into the container
COPY client.py .

# install any necessary dependencies (if needed)
ENTRYPOINT ["python","-u", "client.py"]