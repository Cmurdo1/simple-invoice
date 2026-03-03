
import requests
from bs4 import BeautifulSoup
import re
import json
import time

# Configuration
CRAIGSLIST_URL = "https://portland.craigslist.org"
SEARCH_TERMS = ["dump run", "mobile mechanic"]
LOCATIONS = ["beaverton", "tigard", "portland"]
WEBHOOK_URL = "https://honestinvoice.com/nerve-center"

def scrape_craigslist():
    leads = []
    for term in SEARCH_TERMS:
        for loc in LOCATIONS:
            search_url = f"{CRAIGSLIST_URL}/search/sss?query={term.replace(" ", "+")}&area={loc}"
            print(f"Searching: {search_url}")
            try:
                response = requests.get(search_url)
                response.raise_for_status()  # Raise an exception for HTTP errors
            except requests.exceptions.RequestException as e:
                print(f"Error fetching {search_url}: {e}")
                continue

            soup = BeautifulSoup(response.text, "html.parser")
            
            # Find all postings
            postings = soup.find_all("li", class_="result-row")

            for post in postings:
                post_data = {}
                
                # Post URL and Title
                link_tag = post.find("a", class_="result-title")
                if link_tag and link_tag.get("href"):
                    post_data["post_url"] = link_tag["href"]
                    post_data["job_description"] = link_tag.text.strip()
                else:
                    continue # Skip if no valid link

                # Date Posted
                time_tag = post.find("time", class_="result-date")
                if time_tag and time_tag.get("datetime"):
                    post_data["date_posted"] = time_tag["datetime"]

                # Location (from search area, Craigslist posts often don't have specific location in listing summary)
                post_data["location"] = loc.capitalize()

                # Attempt to get more details from the individual post page
                if post_data.get("post_url"):
                    try:
                        post_response = requests.get(post_data["post_url"])
                        post_response.raise_for_status()
                        post_soup = BeautifulSoup(post_response.text, "html.parser")

                        # Job Description (more detailed from post body)
                        body_content = post_soup.find("section", id="postingbody")
                        if body_content:
                            # Remove the 
        # Remove the "QR Code Link to This Post" text
                            for span in body_content.find_all("span", string=re.compile("QR Code Link to This Post")):
                                span.decompose()
                            post_data["job_description"] = body_content.get_text(separator=" ", strip=True)

                        # Contact Info (email/phone) - often in the body or a reply link
                        email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', post_data["job_description"])
                        if email_match:
                            post_data["contact_info"] = email_match.group(0)
                        else:
                            phone_match = re.search(r'\b(?:\d{3}[-.\s]?){2}\d{4}\b', post_data["job_description"])
                            if phone_match:
                                post_data["contact_info"] = phone_match.group(0)

                    except requests.exceptions.RequestException as e:
                        print(f"Error fetching post page {post_data["post_url"]}: {e}")
                        continue

                # Poster Name - Craigslist usually doesn't have a specific poster name field, so we can leave it blank or infer
                post_data["poster_name"] = "N/A" # Or try to extract from job_description if a pattern emerges

                leads.append(post_data)
                time.sleep(1) # Be polite and avoid hammering the server

    return leads

def post_lead_to_webhook(lead_data):
    try:
        response = requests.post(WEBHOOK_URL, json=lead_data)
        response.raise_for_status()
        print(f"Successfully posted lead to webhook: {lead_data.get("post_url")}")
    except requests.exceptions.RequestException as e:
        print(f"Error posting lead to webhook {WEBHOOK_URL}: {e}")

if __name__ == "__main__":
    scraped_leads = scrape_craigslist()
    print(f"Found {len(scraped_leads)} leads.")
    for lead in scraped_leads:
        post_lead_to_webhook(lead)

