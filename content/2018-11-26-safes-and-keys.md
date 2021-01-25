Title: Safes and Keys
Date: 2018-11-16
Tags: puzzle, combinatorics

Here's a few similar puzzles with a common story:

> I have *n* safes, each one with a unique key that opens it. Unfortunately, some prankster snuck into my office last night and stole my key ring. It seems they've randomly put the keys inside the safes (one key per safe), and locked them.

We'll play around with a few different conditions and see what chances we have of getting all safes unlocked, and at what cost.

<!-- more -->

---

**1) The prankster was a bit sloppy, and forgot to lock one of the safes. What is the probability I can unlock all of my safes?**

The key observation here, as with the subsequent problems, is to consider the arrangement of keys and safes as a permutation. Label the safes and keys $1$ to $n$, and define $\pi(i)$ to be the number of the key inside the $i$th safe. So, if we have key $1$, we unlock safe $1$ to reveal key $\pi(1)$.

Under this interpretation, key $i$ lets us unlock all safes in the cycle containing $i$; we open a safe, find a new key, track down the new safe, and repeat until we end up where we started. So, we want to know the probability that a randomly chosen permutation has exactly one cycle.

This isn't too hard; we can count the number of one-cycle permutations in a straightforward way. Given a permutation of one cycle, we start with element $1$, we write out $\pi(1)$, $\pi(\pi(1))$, etc, until we loop back to $1$. This produces an ordered list of $n$ numbers, starting with $1$, and this uniquely determines the cycle. There are $(n-1)!$ such lists, and so the probability of having exactly one cycle is $(n-1)!/n! = 1/n$

---

**2) Say the prankster is sloppier, and leaves k safes unlocked. Now what is my probability of success?**

This one requires a little more thought. It's tempting to consider permutations with $k$ cycles, but that's not quite right. If there's only one cycle, we're sure to succeed, and furthermore, even if there are $k$ cycles, our success isn't guaranteed: we could pick two safes in the same cycle.

By symmetry, label our safes so that we've picked safes $1$, $2$, ..., $k$. We'd like to know how many permutations have a cycle that completely avoid $1$ through $k$. If, and only if, such a cycle is present, we fail to unlock all the safes.

Let $a_i$ be the number of "good" permutations when there are $i$ safes. We will express $a_n$ in terms of smaller $a_i$s, and solve the resulting recurrence relation.

Given a permutation $\pi$, we can split the set $\{ 1, \ldots n \}$ into two parts: those that have cycles intersecting $\{ 1, \ldots, k \}$, and those that do not. (It may help to think of these sets as "reachable" and "unreachable" safes, respectively). Since $\pi$ never sends a reachable safe to an unreachable one, or vice versa, it induces permutations on both these sets. Also, knowing both these subpermutations, we can reconstruct $\pi$. So, let's count how many possible permutations there are on the reachable and unreachable sets.

If there are $r$ reachable safes, then there are $a_r$ possible permutations induced on the reachable set, and $(n-r)!$ induced on the unreachable one. (The reason we don't get the full $r!$ on the reachable set is that some permutations would leave a safe unreachable, when it's supposed to be reachable.) Furthermore, we have a choice of *which* safes are reachable. The first $k$ safes must be reachable, so beyond that, we have $\binom{n-k}{r-k}$ more choices to make. Our recurrence relation is then:
$$ n! = \sum_{r = k}^n \binom{n-k}{r-k} a_r (n-r)! = \sum_{r = k}^n a_r \frac{(n-k)!}{(r-k)!} $$

Since $(n-k)!$ doesn't depend on $r$, we can pull it out to get a neater-looking form:
$$ \frac{n!}{(n-k)!} = \sum_{r=k}^n \frac{a_r}{(r-k)!} $$

Now $n$ only shows up as an index, not anywhere in the summand. This lets us collapse our sum; take this term, and subtract it from the corresponding one for $n-1$:
$$
\begin{align*}
\frac{n!}{(n-k)!} - \frac{(n-1)!}{(n-1-k)!} &= \left( \sum_{r=k}^n \frac{a_r}{(r-k)!} \right) - \left( \sum_{r=k}^{n-1} \frac{a_r}{(r-k)!} \right) \\
\frac{n!}{(n-k)!} - \frac{(n-1)!}{(n-1-k)!} &= \frac{a_n}{(n-k)!} \\
n! - (n-1)!(n-k) &= a_n \\
k \cdot (n-1)! &= a_n
\end{align*}
$$

So there's $k \cdot (n-1)!$ permutations in which we win. Since there's $n!$ total, this gives our probability of success at $k/n$.

---

**3) If the prankster is careful, and remembers to lock all the safes, then I have no choice but to break some of them open. What's the expected number of safes I have to crack?**

This one's much easier than 2). The question here is just "how many cycles are there in a random permutation", and [from a previous post](/linearity-expectation), we know that's $H_n$, the $n$th harmonic number.

---

**4) Putting it all together: if we start with $k$ safes unlocked, what's the expected number of safes I have to crack open?**

I haven't actually put this one on solid ground yet! It's not coming out pretty.
