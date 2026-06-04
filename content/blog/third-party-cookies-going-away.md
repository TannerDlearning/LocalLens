---
title: "The Tracking Techniques That Replaced Third-Party Cookies (2026)"
seoTitle: "Third-Party Cookies Are Gone — How Sites Still Track You"
date: "2025-06-02"
excerpt: "Third-party cookies are blocked — but websites still track you. See the techniques that replaced them, from CNAME cloaking to fingerprinting."
coverImage: "/blog/third-party-cookies-going-away.png"
category: "Privacy News"
author: "Permission Trail Team"
readTime: "5 min read"
---

For years, third-party cookies have been the backbone of online advertising. Now they're being blocked by default in most browsers, and Google is at least partially following suit. If you've read headlines about this and wondered what it actually means for your privacy, here's an honest breakdown.

## What Are Third-Party Cookies?

A first-party cookie is set by the website you're visiting. A third-party cookie is set by a different domain, one that's running scripts or loading resources on that page.

For example, if you visit a news site that includes an ad from an advertising network, that ad network can set a cookie in your browser. When you visit another site using the same ad network, the network recognises your cookie and knows you visited both. Repeat this across thousands of sites and you get a detailed picture of someone's browsing history, all without them explicitly providing it.

This is the core mechanism behind retargeted advertising: you look at a pair of trainers, then see ads for them everywhere you go.

## Why Are Browsers Blocking Third-Party Cookies?

Safari has been blocking third-party cookies by default since 2017 through Intelligent Tracking Prevention. Firefox followed with Enhanced Tracking Protection. Chrome, by far the most widely used browser, has been slower to act.

Google's business model depends on advertising revenue, so there's an obvious tension. Their answer was a set of privacy-preserving alternatives bundled under the Privacy Sandbox project, which attempts to allow interest-based advertising without giving trackers direct access to your browsing history.

As of 2024, Chrome began showing prompts asking users whether they wanted to opt into keeping third-party cookie support. Most users clicked through without changing the default.

## What Changes for You?

For regular users, the most immediate effect is that cross-site tracking becomes significantly harder. That doesn't mean all tracking stops.

The advertising industry has adapted with several approaches:

**First-party data collection.** Sites increasingly ask you to log in or provide an email address. This lets them identify you directly rather than relying on cookies.

**CNAME cloaking.** Third-party trackers load via a subdomain of the first-party site, making them appear to be first-party resources. This bypasses most cookie-blocking.

**Browser fingerprinting.** Fingerprinting tracks you without storing anything, so cookie blocking doesn't affect it at all. We covered this in more detail in our article on [browser fingerprinting](/blog/what-is-browser-fingerprinting).

**Server-side tracking.** Some analytics providers have moved tracking logic to the server side, where browser-level protections don't apply.

## Does This Mean Tracking Is Over?

Not by a long way. The decline of third-party cookies is a significant change to one specific tracking mechanism. The underlying incentive to track users hasn't changed, and the industry has been developing alternatives for years.

What it does mean is that your browser can tell you less about what's tracking you, because more of it happens elsewhere.

## What Actually Lives in Your Browser Now

Even with third-party cookies blocked, websites still store a significant amount of data locally. First-party cookies, local storage, IndexedDB, session storage, and service workers all remain active and largely unaffected by cookie policy changes.

If you want to understand what a website has stored in your browser, blocking third-party cookies only gives you part of the picture. [Permission Trail](https://www.permissiontrail.co.uk/) shows you everything across all storage types, regardless of whether it came from first-party or third-party code.

## Should You Do Anything?

Third-party cookie blocking by default is a genuine improvement. You don't need to do anything to benefit from it in Safari, Firefox, or Brave.

In Chrome, you can verify that third-party cookie protections are in place by going to Settings, then Privacy and Security, then Third-party cookies.

For a fuller approach to browser privacy, it's worth also understanding and periodically reviewing the first-party storage that sites accumulate over time. Our article on [why clearing cookies isn't enough](/blog/why-clearing-cookies-isnt-enough) explains exactly what storage types survive a cookie clear — and what you should be clearing instead.
