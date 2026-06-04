---
title: "Local Storage vs Cookies: The Privacy Risk You're Missing (2026)"
seoTitle: "Local Storage vs Cookies: What You're Not Clearing"
date: "2025-01-20"
excerpt: "Cookies aren't the only place websites store data. Local storage holds far more — and clearing cookies won't touch it. Here's what you need to know."
coverImage: "/blog/Local Storage vs Cookies What's the Difference.png"
category: "Technical Deep Dive"
author: "Permission Trail Team"
readTime: "6 min read"
---

When people talk about browser privacy, cookies get most of the attention. But modern websites store data in several places, and local storage has quietly become just as important, and in some ways more privacy-relevant.

## The Basics

**Cookies** have been around since 1994. They're small text files (max 4KB each) that are automatically sent to the server with every HTTP request. This is both their core feature and their key limitation: every cookie for a domain gets included in every request to that domain, adding overhead.

**Local Storage** was introduced with HTML5 in 2009. It can hold up to 5-10MB per domain, is never automatically sent to servers, and persists until explicitly cleared. It's accessible only via JavaScript, making it invisible to casual inspection.

## What Makes Them Different for Privacy

The automatic-sending behaviour of cookies creates opportunities for third-party tracking. A cookie set by an ad network can be read by that network on any site where their scripts load. Local storage doesn't work this way: it's strictly same-origin, meaning only scripts from the exact same domain can access it.

So local storage is safer? Not quite.

Because local storage persists indefinitely and can hold much more data, it's actually better suited to storing persistent identifiers. A site can generate a unique ID for you, store it in local storage, and it will still be there years later unless you explicitly clear it. Clearing your cookies won't help.

## Super Cookies and Evercookies

Some trackers use both storage mechanisms redundantly. The technique, sometimes called an "evercookie" or "super cookie", works like this:

1. Store a unique identifier in cookies, local storage, and several other locations (IndexedDB, cache, etc.)
2. If the user clears one storage type, check the others
3. Restore the identifier from whichever copy survives

This means clearing just your cookies gives you a false sense of security. A determined tracker can reconstruct your identifier from whatever you left intact. Our article on [why clearing cookies isn't enough](/blog/why-clearing-cookies-isnt-enough) covers this in more detail, including what actually works.

## Session Storage

There's a third type worth mentioning: **session storage**. It works like local storage but is cleared when the browser tab is closed. It's the most privacy-friendly of the three, and is typically used for temporary things like form data or multi-step processes.

## IndexedDB and Cache Storage

For completeness:

**IndexedDB** is a full client-side database. It's designed for complex apps like email clients and document editors that need to store structured data offline. Privacy-wise it behaves like local storage: same-origin, persistent, doesn't auto-send. It can store far more data than local storage.

**Cache Storage** is part of the Service Worker API. It stores complete HTTP responses: HTML, CSS, JavaScript, images. Its primary purpose is offline functionality and performance, but cached JavaScript files can contain tracking code that persists independently of cookies.

## Inspecting Your Own Storage

Most browsers have developer tools that let you inspect storage directly. In Chrome or Edge:

1. Open DevTools (F12)
2. Go to the Application tab
3. In the left panel, expand Storage to see Cookies, Local Storage, Session Storage, IndexedDB, Cache Storage

For most people, though, developer tools are unintuitive. [Permission Trail's dashboard](https://www.permissiontrail.co.uk/) gives you a plain-English breakdown of what each site has stored across all storage types, sorted by how many tracking items each site has left behind.

## What Should You Clear?

**Cookies:** clear regularly. Third-party cookies especially, though most browsers now block these by default. First-party cookies from sites you use regularly are fine to keep.

**Local storage:** worth clearing for sites you don't actively use or trust. Sites you log into regularly will store useful things here; sites you visit once might be storing a persistent tracker.

**IndexedDB and Cache:** less urgently, but worth clearing periodically for sites you no longer use or that you found had many trackers.

The key insight is that these storage types are separate buckets. Clearing one doesn't affect the others. A holistic approach means being aware of all of them.

For a broader overview of how cookies work and the different ways they're used for tracking, see our [cookies explained guide](/blog/cookies-explained).
