let input = '';
process.stdin.setEncoding('utf8');
for await (const chunk of process.stdin) input += chunk;
console.log(JSON.stringify({ category: 'account-access', urgent: input.includes('cannot log in') }));
