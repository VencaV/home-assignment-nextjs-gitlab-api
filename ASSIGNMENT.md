# Assignment
As per our agreement, here is the promised test assignment. Please implement it in Next.js.

We need a tool to verify that no unauthorized person has access to our groups and projects in GitLab.

The tool should be as simple to use as possible — it receives a top-level group ID via a form and displays the result in a human-readable format.

The access token must **not** be passed as a command-line argument, but should be easy to replace. How to meet this requirement is left to the implementer.

## How GitLab groups, projects, and users work

- Groups can be nested arbitrarily deep — there is **no depth limit**
- Projects always belong to a group; there is no such thing as sub-projects
- Users can be members of **both** groups and projects

## Required output data

- The output should be a list of users with details *(see next point)*
- For each user, we need to know:
    - Full name *(i.e. first and last name)*
    - Username
    - List of groups they are a member of, including their permission level *(only within the input group ID or its subgroups)*
    - List of projects they are a member of, including their permission level *(only within the input group ID or its subgroups)*
- The total number of users should be shown at the end of the output

## Sample output

On the test environment, the tool should produce the following data. The format does not need to be preserved exactly, but we want the tool to be *practically usable*, so it should be similarly readable.

```
Homer Simpson (@user_1)
Groups:    [acme-corp/testovaci-zadani (Owner)]
Projects:  []

Montgomery Burns (@user_2)
Groups:    [acme-corp/testovaci-zadani (Owner)]
Projects:  []

Ned Flanders (@user_4)
Groups:    [acme-corp/testovaci-zadani/skupina-3 (Guest)]
Projects:  [acme-corp/testovaci-zadani/uloha-1 (Guest)]

Waylon Smithers (@user_5)
Groups:    []
Projects:  [acme-corp/testovaci-zadani/uloha-1 (Developer), acme-corp/testovaci-zadani/skupina-2/skupina-4/projekt-3 (Guest), acme-corp/testovaci-zadani/skupina-3/projekt-2 (Guest)]

Apu Nahasapeemapetilon (@user_3)
Groups:    [acme-corp/testovaci-zadani/skupina-1 (Guest)]
Projects:  []

Total Users: 5
```

## Scalability

The test environment has 5 users, 5 groups (including the top-level one), and 4 projects. However, the tool must also work in a real environment with around 500 projects, a few dozen groups, and approximately 50 users.

# Credentials and additional development information

A read-only test environment is available for development with the following details:

- Top-level group ID: `10975505`
- Access token: `glpat-your-token-here`

The GitLab **REST API** must be used, *not* GraphQL. Its documentation is available here: https://docs.gitlab.com/ee/api/

The GitLab API offers an endpoint https://docs.gitlab.com/api/users/#list-projects-and-groups-that-a-user-is-a-member-of , but you do *not* have an administrator access token for it. The point of this assignment is to understand the API, fetch data, and combine it.
