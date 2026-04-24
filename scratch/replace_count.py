import os
import glob

def run():
    files = glob.glob('**/*.ts', recursive=True) + glob.glob('**/*.tsx', recursive=True)
    for f in files:
        if 'node_modules' in f or '.next' in f: continue
        with open(f, 'r') as file:
            content = file.read()
        
        new_content = content.replace('.select("*", { count: "exact", head: true })', '.select("id", { count: "exact", head: true })')
        new_content = new_content.replace(".select('*', { count: 'exact', head: true })", ".select('id', { count: 'exact', head: true })")
        
        if new_content != content:
            with open(f, 'w') as file:
                file.write(new_content)
            print(f"Updated {f}")

run()
