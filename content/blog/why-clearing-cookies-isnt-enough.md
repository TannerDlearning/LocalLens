---
title: "Why Clearing Cookies Isn't Enough (2026)"
date: "2025-07-25"
excerpt: "Deleting cookies is a good start — but websites store data in local storage, IndexedDB, and cache too. See what you're missing and how to clear it all."
coverImage: "/blog/why-clearing-cookies-not-enough.png"
category: "Privacy Basics"
author: "Permission Trail Team"
readTime: "5 min read"
---

Clearing your cookies feels like the obvious privacy move. It's well known, built into every browser, and comes up in nearly every article about online tracking. The problem is that it only addresses one part of how websites store data on your device.

If you clear your cookies and feel like you've cleaned up your browser, this article is for you.

## What Cookies Actually Do

Cookies are small text values stored by your browser. A website can use them to remember that you're logged in, store your preferences, or track you across visits.

When you clear your cookies, those values are deleted. The website will no longer recognise you from your last visit. Any tracking identifiers stored as cookies will be gone.

That genuinely matters. Cookies are still the most widely used tracking mechanism on the web.

But here's the thing: cookies are not the only place a website can store data in your browser.

## Local Storage

Local storage was introduced in 2009 as a way for websites to store more data than cookies allow. While cookies are limited to 4KB, local storage can hold up to 5-10MB per domain.

Crucially, local storage is not cleared when you clear your cookies. It's a completely separate storage area.

A website that wants to track you persistently can store a unique identifier in local storage. Even if you clear your cookies every week, that identifier sits untouched.

For a deeper look at how local storage differs from cookies and why clearing one doesn't clear the other, see our guide on [local storage vs cookies](/blog/local-storage-vs-cookies).

## IndexedDB

IndexedDB is a full database built into your browser. It's designed for complex web apps, but it's also used to store persistent tracking data.

Like local storage, IndexedDB is not cleared by deleting cookies. It has its own section in your browser's storage system.

## Cache Storage

When a website loads, your browser downloads its assets: images, scripts, stylesheets. These get saved in cache storage so they load faster on your next visit.

Clearing your cookies doesn't clear the cache. The cached JavaScript files from third-party analytics and advertising scripts remain on your device, ready to run next time you visit.

## Service Workers

Service workers are background scripts that websites can install in your browser. They can run even after you've closed a tab and can store data independently.

Clearing cookies doesn't uninstall service workers. They sit in their own category and need to be explicitly removed to go away.

## The Evercookie Problem

Some trackers use all of these storage types simultaneously. The technique works like this:

1. Store a unique identifier in cookies, local storage, IndexedDB, and elsewhere
2. If the user clears one storage type, check the others
3. Restore the identifier from whichever copy remains

The result is that even if you clear your cookies, the tracker can reconstruct your identifier from local storage or cache. Your cookie clear was effectively undone before you even finished doing it.

This isn't a theoretical concern. Libraries implementing this exact behaviour have been used in the wild, and the technique has a name: evercookie, created by security researcher Samy Kamkar in 2010 to demonstrate the problem.

## What Actually Works

**Clear cookies and site data together.** Most browsers let you choose to clear site data (which includes local storage and IndexedDB) at the same time as cookies. In Chrome, go to Settings, Privacy and security, Delete browsing data, and make sure both "Cookies and other site data" and "Cached images and files" are checked.

**Use a dedicated tool.** [Permission Trail](https://www.permissiontrail.co.uk/) shows you all the stored data for each website across every storage type, and lets you delete it all at once for a specific site or set of sites. This is more targeted than clearing everything, because you can remove data from sites you distrust without losing your logins to sites you use regularly.

**Clear on exit.** Both Chrome and Firefox have options to clear certain storage types automatically when you close the browser. This is a useful habit if you don't want data to accumulate between sessions.

## The Key Takeaway

Cookies are one piece of a larger picture. Understanding that local storage, IndexedDB, cache, and service workers all exist as separate storage areas means you can make more informed decisions about what to clear and when.

Clearing cookies is still worth doing. It just works best when you do it alongside everything else.

Some tracking methods don't rely on browser storage at all. [Browser fingerprinting](/blog/what-is-browser-fingerprinting) can identify you across sessions without storing anything — making it immune to any clearing strategy.
