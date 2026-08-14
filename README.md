# Grove Ingest

Grove Data Ingestion

A project used for taking in 3rd party data and integrating it into Grove, primarily using Composio.
Note: only works locally
Current status: Week 5

## General info


### Why Composio?
Composio is a great product that handles all the complex api integration that would otherwise be needed to be made by hand. It simplifies production with great documentation to add whatever.

### Native vs. Composio
In my testing, Native integration (using the api manually) and Composio both perform at about the same speed. 
With that being said, both have their pros and cons.

Composio is much easier to integrate, however you need to make a Composio account. Whilst that isn't the hardest, it's one more thing that you wouldn't do otherwise.
Native, and I'm going to be blunt here, sucks. I don't feel like there are any benefits to using it, and is much more complex to make than Composio (almost double the line count!)


### Current Integrations
- GitHub
- Gmail
- Google Calendar


## Architecture

### Path 
When ingesting data, it goes like the following:
Spike (ex. Composio) -> Connector (ex. GitHub) -> Renderer -> Sink (ex. Local)

### Output
This outputs the files in Markdown. The titles of these files is the name of the ingested object + the first 8 digits of a base64 encoding for a unique id. 

## Building

### Prerequisites 
- Bun `1.3.14`

### Setup
1. Clone the repo with `git clone https://github.com/Samalando/Grove-Ingest.git`
2. run `bun install` to install dependencies 
3. run `bun run web` to start the web version, or `bun run cli` to run the cli version

---

## How to use
Simply go through the prompts, answering when asked. 

### Setting up Composio 
1. Sign in to composio.dev and open your project.
2. Go to Settings → Project Settings → API Keys.
3. Create a new key and select the permission level for each resource.
4. Copy the key and paste it somewhere easy to find, like the Notes app.

### Selecting the output (Web Only)
There are currently two ways to select your output, depending on the browser.
On Chromium-based browsers (ex. Google Chrome, Microsoft Edge, Brave), a normal file selector will show up. On non Chromium-based browsers (ex. Firefox, Safari), a custom file selector will show up, based on a locally hosted server. This is because these browsers won't support the file selector api for security.


---
### Issues?
Email me@samalando.com, or make a GitHub issue!
