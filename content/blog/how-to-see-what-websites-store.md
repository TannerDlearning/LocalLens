---
title: "How to See What Websites Store in Your Browser (2026)"
date: "2025-07-08"
excerpt: "Most people never see what websites leave behind. Discover how to check cookies, IndexedDB, cache and service workers stored in your browser — in seconds."
coverImage: "/blog/see-what-websites-store-in-browser.png"
category: "How-To Guide"
author: "Permission Trail Team"
readTime: "4 min read"
---

Websites quietly store data in your browser every time you visit. Some of it is useful. Some of it is tracking you. Very few people ever look at what's actually there. Here's how to check for yourself.

## What Types of Data Do Websites Store?

Before you look, it's worth knowing what you're looking for. Websites can store data in several different places in your browser:

- **Cookies:** small text values, often used for login sessions and tracking
- **Local storage:** larger key-value data that persists until manually cleared
- **Session storage:** similar to local storage but clears when the tab closes
- **IndexedDB:** a full database, used by more complex web apps
- **Cache storage:** copies of files like HTML, JavaScript, images, and API responses
- **Service workers:** background scripts that can run even after you close the tab

Most browsers expose all of this through developer tools, though the interface is designed for developers rather than everyday users. For context on which of these storage types pose the biggest privacy risk, our guide on [7 ways websites track you beyond cookies](/blog/what-are-browser-trackers) is a useful starting point.

## Using Chrome or Edge DevTools

This method works in both Chrome and Microsoft Edge.

1. Visit the website you want to inspect
2. Press **F12** to open DevTools (or right-click anywhere on the page and select Inspect)
3. Click the **Application** tab at the top (you may need to click the arrow to reveal more tabs)
4. In the left panel, look under **Storage**

You'll see sections for Cookies, Local Storage, Session Storage, IndexedDB, Cache Storage, and more. Click on any of these to see exactly what's been stored.

### Reading Cookies

Click **Cookies** in the left panel, then select the site domain. You'll see a table with each cookie's name, value, domain, expiry date, and other properties.

Cookies with names like `_ga`, `_gid`, or `_fbp` are analytics and advertising trackers. Cookies with names matching your account on the site are probably session tokens.

### Reading Local Storage

Click **Local Storage**, then the domain. You'll see key-value pairs. These often contain user preferences, session data, or persistent identifiers.

### Reading IndexedDB

IndexedDB can hold a lot of structured data. Expand the IndexedDB section to see any databases created by the site, then browse through the object stores inside them.

## What to Look For

A few things worth paying attention to:

**Third-party domains.** When you're on a website, DevTools will show cookies and storage for the main domain plus any third-party domains that have set data. Advertising and analytics providers often set cookies from their own domains.

**Expiry dates.** Cookies that expire in years rather than days are intended to track you long-term.

**Unfamiliar key names.** If you see keys with random-looking hashes or UUIDs in local storage or cookies, those are almost certainly tracking identifiers. Our guide on [local storage vs cookies](/blog/local-storage-vs-cookies) explains why these persistent identifiers are often more privacy-relevant than cookies.

**Size.** Some sites store surprisingly large amounts of data. It's worth knowing how much a site is using on your device.

## An Easier Option

If DevTools feels overwhelming, [Permission Trail](https://www.permissiontrail.co.uk/) gives you the same information in a more readable format. It shows a breakdown of each website's stored data across all storage types, grouped by site, and lets you delete everything from a specific site with one click.

It's particularly useful when you want to do a regular audit rather than inspect sites one by one through DevTools.

## What to Do After Looking

Finding that a site has stored a lot of data doesn't necessarily mean something suspicious is happening. But if you find tracking cookies from advertising networks, persistent identifiers in local storage from sites you rarely visit, or service workers from sites you haven't used in months, then it's worth clearing that site's data.

In DevTools, you can right-click a domain and select "Clear" to remove all stored data for it. In Permission Trail, you can do the same from the dashboard in a single click.

The point is not to be alarmed by what you find. It's to be informed about it.
