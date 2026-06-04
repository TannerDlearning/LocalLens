---
title: "Cookies Explained: Good, Bad & the Tracking Kind (2026)"
date: "2025-02-28"
excerpt: "Not all cookies are bad — but many track you silently. Learn which cookies are essential and which ones are building a profile of your browsing habits."
coverImage: "/blog/Cookies Explained The Good, the Bad, and the Tracking Kind.png"
category: "Privacy Basics"
author: "Permission Trail Team"
readTime: "4 min read"
---

The word "cookie" has become synonymous with online tracking, but that reputation isn't entirely fair. Cookies are a fundamental part of how the web works. The problem is that the same mechanism that keeps you logged in can also be exploited to track your every move.

## A Brief History

Cookies were invented in 1994 by Lou Montulli at Netscape. The original use case was simple: shopping carts. Without some way to persist state between page loads, an e-commerce site couldn't remember what you'd put in your cart. Cookies solved that problem elegantly.

For years, this remained their primary use. Then advertisers discovered them.

## First-Party vs Third-Party Cookies

This distinction is the most important one to understand.

**First-party cookies** are set by the website you're actually visiting. They're used for things like keeping you logged in, remembering your language preference, or storing items in a shopping cart. These are generally fine and make the web significantly more usable.

**Third-party cookies** are set by domains other than the one you're visiting. If you're on a news site and it loads an ad from an advertising network, that network can set a cookie in your browser. When you visit another site that uses the same ad network, it recognises your cookie and knows you visited both sites.

Multiply this across thousands of websites using the same handful of advertising networks, and you start to see the scale of the problem.

## What Information Do Cookies Contain?

Cookies themselves are just text. A typical tracking cookie might contain a unique identifier like `user_id=a8f3b2c1d9e4`. On its own, this tells you nothing. The power comes from what the tracking company correlates with that identifier on their servers: which sites you've visited, how long you spent on each page, what you clicked on, when you typically browse.

## The Cookie Notice Problem

Since GDPR came into force in 2018, websites in Europe are required to get consent before setting non-essential cookies. This led to the proliferation of cookie banners, those often frustrating pop-ups you see on nearly every site.

In practice, many cookie consent implementations are designed to nudge you towards accepting everything. Dark patterns like making "Accept All" a single large button while burying "Reject All" or "Manage Preferences" in smaller text are extremely common. Studies have found that the majority of users simply click accept to make the banner disappear.

## First-Party Tracking as a Workaround

As major browsers have moved to phase out third-party cookies, advertisers have adapted. First-party data collection (where a site collects your email or other identifier and then matches it against advertising networks' own databases) has become increasingly common.

CNAME cloaking is another workaround: a third-party tracker is served from a subdomain of the site you're visiting (like `analytics.example.com` pointing to `tracker.example.net`), making it appear to be a first-party resource. And even when you successfully clear cookies, websites also store data in [local storage and IndexedDB](/blog/local-storage-vs-cookies) — clearing one doesn't touch the others.

## How to Actually Manage Your Cookies

Your browser has built-in cookie management, but it's not particularly transparent. You can go to your browser's settings and delete all cookies, but this is a blunt instrument: you'll be logged out of everything.

A more precise approach is to inspect and clear storage on a site-by-site basis. [Permission Trail](https://www.permissiontrail.co.uk/) gives you a breakdown of exactly what each site has stored in your browser (cookies, local storage, IndexedDB, cache) and lets you delete specific items or everything from a given site with a single click.

That way, you can clear tracking data without losing your logins or preferences for sites you trust.

For a practical breakdown of exactly why cookie clearing alone isn't sufficient, see our guide on [why clearing cookies isn't enough](/blog/why-clearing-cookies-isnt-enough).
