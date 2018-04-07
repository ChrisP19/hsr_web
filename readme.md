# HSR (Human Support Robot) Web Server
This is the repository for the HSR web server that allows the HSR to request
help for understanding it's environment by sending images to a server that then broadcasts the image to clients.

## Installation
Tested and maintained for Python 2.7.10
### Clone the Repo
```
git clone https://github.com/ChrisP19/hsr_web.git
```

### Virtual Environment Setup
Before installing dependencies, we strongly recommend that you setup a virtual environment in the folder that you clone the repo in. This makes sure that
your dependencies are fully compatible with the python version we recommend (2.7).

```
virtualenv -p /usr/bin/python2.7 hsr_web
cd hsr_web
source bin/activate
```

### Installing Using Pip
To install dependencies, we recommend cloning into the repo and installing the libraries using pip
```
pip install -r requirements.txt
```

### Running the Server
* To startup the server, run the following shell script.
```
sh makecomm.sh
```
* To startup the client, open up a new terminal tab and run psiturk. Then turn the
server on and run debug. The GUI interface should now be available in your web
browser. (Make sure AdBlock is turned off!)
```
psiturk
server on
debug
```
