website openera.openlearn.org.in

we are making backend of a website for submissions of a hackathon, with prisma postgres, docker, docker, render, typescript.
it should be secure.
refer to prisma schema, 
after making a ton of endpoints make documentation at /docs endpoints
use docker

i want to make a backend in node, prisma, postgres, typescript express, docker. this is for a website of a hackathon, named open era, where we just have to accept some form data from the user and serve it to the admin for review.

so on the website user will come, and add these fields as the part of there assignment submission
here are all the fields
* Team Name: AI Innovators
* Team Leader: John Doe
* Email: john@example.com
* Status: pending (by default
* Demo URL: https://demo.aiinnovators.com
* Github Repository: https://github.com/aiinnovators/fintech-ai
* Presentation (Drive Link): https://drive.google.com/file/d/1234567890
* Submitted At: 15/01/2025, 16:00:00 (auto generated)

so I need to accept that store this data efficiently to postgres and serve all of this to admin, on admin panel, where the admin can sort this and everything, and while accepting or for every movement we need to also maintain a audit log.
make it secure and ip limited.
and show this to admin with different endpoints and perform crud on it.
on the user part who is submitting, they cant submit twice. 
there will be admin which will be seeded to the db, and then we will do jwt for admin with proper refresh token, the login thing will only will be for admin, not for users who are filling the form at all, and we need to collect all the info of the users as much as possible. there are no file uploads at all

we will deploy on render only