import json
import numpy as np

with open('graph.json', 'r') as f:
    graphdata = json.load(f)

def expand_node(area_name):
    if area_name in row_names:
        return [area_name]
    area_elements = graphdata['areas'].get(area_name)
    if area_elements is None:
        print(f"Not found: {area_name}")
        return None
    else:
        expanded = []
        for element in area_elements:
            if element in row_names:
                expanded.append(element)
            else:
                expanded.extend(expand_node(element))
        return expanded

def check_tree():
    return True


start_year = 1200
end_year = 1940

row_names = {
    r: k
    for k,r in enumerate(graphdata['rows'])
}

num_rows = len(row_names)
num_columns = end_year - start_year
print(num_rows)
M = np.empty((num_rows, num_columns), dtype=object)

try:
    for context in graphdata.get('contexts'):
        for timeline in graphdata['contexts'][context]:
            
            obj_start = timeline[1]
            obj_end = timeline[2]
            if obj_end is None:
                obj_end = end_year
            col_start = max(obj_start-start_year, 0)
            col_end = min(num_columns-1, obj_end-start_year)
            
            obj_name = timeline[0]
            row_number = row_names.get(obj_name)
            if row_number is not None:
                M[row_number, col_start:col_end] = context
            else:
                obj_rows = expand_node(obj_name)
                # print(f"{obj_name}: {obj_rows}")
                for obj_row in obj_rows:
                    row_number = row_names.get(obj_row)
                    M[row_number, col_start:col_end] = context
except Exception as e:
    print(f"Exception: {e}")

context_array = M.tolist()
border_array = []

for i, row in enumerate(context_array):
    border_row = []
    # if i > 20:
    #     break
    for j, cell in enumerate(row):
        # if j < 20:
        #     pass
        # if j > 60:
        #     break
        # print(f"({i},{j}) {cell}")
        t_border, r_border, b_border, l_border = False, False, False, False
        if i>0:
            t_match = (context_array[i][j] == context_array[i-1][j])
        if j<num_columns-1:
            r_match = (context_array[i][j] == context_array[i][j+1])
        if i<num_rows-1:
            b_match = (context_array[i][j] == context_array[i+1][j])
        if j>0:
            l_match = (context_array[i][j] == context_array[i][j-1])

        if i==0 or not t_match:
            t_border = True
        if j==0 or not l_match:
            l_border = True
        if j==num_columns or not r_match:
            r_border = True
        if i==num_rows or not b_match:
            b_border = True

        border_row.append([t_border, r_border, b_border, l_border])
    border_array.append(border_row)

import random

def random_hex_color():
    return "#{:02x}{:02x}{:02x}".format(random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))

colour_map = {
    context: random_hex_color()
    for context in graphdata.get('contexts')
}
colour_map.update({None: '#f1e2b3'})


output_dict = {
    'num_rows': num_rows,
    'num_cols': num_columns,
    'data': context_array,
    'borders': border_array,
    'colours': colour_map,
    'row_names': list(row_names.keys())
}

np.savetxt('grid_contents.csv', M, delimiter=',', fmt='%s')
with open('./www/public/grid_contents.json', 'w') as f:
    json.dump(output_dict, f)
# print(M)