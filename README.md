<img src="https://i.imgur.com/zMLdPRt.png" width="20%">
# Dollarr

This was made in a week back in May 2019 and proposed to [OwlGaming](https//www.owlgaming.net/) (A Multi Theft Auto game server).

The site would have allowed characters to be able to transfer money between each other anonymously for whatever in-character reasons they wanted. It is fully functioning from signing up to making and approving deposits and sending the money to different addresses.

Has built-in protection against Alt-Alting (the process of transferring assets from one character you own to another without paying for a transfer) as well as banning people from using the site.

![Home Page](https://i.imgur.com/HBEjf5H.png "Home Page")
(lost my imgur album showcasing all of the pages and how they work and I cba to go through it all again so hopefully you get the jist of it)

NodeJS site built using the KeystoneJS framework and uses MongoDB as it's NoSQL database system. Pug for page templates etc. etc.

Won't work out of the box, you'll need to remove the email address verification in the keystone so that people can log in and register with an "email" which would be their username (by default it must include an '@' and must be formatted like an email or something along those lines.) 
