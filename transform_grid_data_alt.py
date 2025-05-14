import json
import numpy as np
from pprint import pprint

with open('grid_data.json', 'r') as f:
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
# print(row_names)


num_rows = len(row_names)
num_columns = end_year - start_year
# print(num_rows)
polygon_data = {}

try:
    for context in graphdata.get('contexts'):
        polygon_data[context] = []
        for timeline in graphdata['contexts'][context]:
            obj_name = timeline[0]
            row_number = row_names.get(obj_name)
            obj_start = timeline[1]
            col_start = max(obj_start-start_year, 0)
            obj_end = timeline[2]
            if obj_end is None:
                obj_end = end_year
            col_end = min(num_columns-1, obj_end-start_year)

            if row_number is not None:
                polygon_data[context].append([row_number, col_start, col_end])
            else:
                obj_rows = expand_node(obj_name)
                for obj_row in obj_rows:
                    row_number = row_names.get(obj_row)
                    polygon_data[context].append([row_number, col_start, col_end])
        polygon_data[context].sort()
except Exception as e:
    print(f"Exception: {e}")

# Safavid Empire         [4, 310, 536]
# Safavid Empire         [5, 304, 536]
# Safavid Empire         [6, 301, 536]
# Safavid Empire         [7, 309, 366]
# Mamluk Sultanate        [8, 91, 317]
# Mamluk Sultanate        [9, 50, 317]

def rows_to_points(context_subset):
    # Each row looks like [row_num, col_start, col_end]. This method
    # takes a list of such lists and returns a list of [x,y] coords.
    point_list = []
    for k,row in enumerate(context_subset):
        if k==0:
            # First row gets a top line
            point_list.append((row[0],row[1]))
            point_list.append((row[0],row[2]))
        if k==len(context_subset)-1:
            # Last row gets a bottom line
            point_list.append((row[0]+1,row[1]))
            point_list.append((row[0]+1,row[2]))
        if k!=0 and row[1] != context_subset[k-1][1]:
            point_list.append((row[0], row[1]))
            point_list.append((row[0], context_subset[k-1][1]))
        if k!=0 and row[2] != context_subset[k-1][2]:
            point_list.append((row[0], row[2]))
            point_list.append((row[0], context_subset[k-1][2]))
    return point_list

polygon_points = []
for context in polygon_data.keys():
    break_idx = 0
    for i in range(len(polygon_data[context])):
        if i==len(polygon_data[context])-1:
            context_subset = polygon_data[context][break_idx:i+1]
            point_list = rows_to_points(context_subset)
            polygon_points.append({'name': context, 'points': point_list})
        elif polygon_data[context][i+1][0] != polygon_data[context][i][0]+1:
            context_subset = polygon_data[context][break_idx:i+1]
            point_list = rows_to_points(context_subset)
            polygon_points.append({'name': context, 'points': point_list})
            # polygon_points.append({'name': context, 'points': polygon_data[context][break_idx:i+1]})
            break_idx = i+1
        print(f"{context}\t{polygon_data[context][i]}")

pprint(polygon_points)
with open('./www/public/grid_points.json', 'w') as f:
    json.dump(polygon_points, f)
"""
context_array = M.tolist()
border_array = []

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
"""